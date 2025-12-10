from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import cv2
import numpy as np
import io
import torch
import os
from pathlib import Path

app = FastAPI()

# Allow your React app to talk to this Python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_image_with_notebook_logic(images_bytes_list, prompt):
    # 1. Convert bytes to a format OpenCV/PIL understands
    images = []
    for image_bytes in images_bytes_list:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        images.append(img)

    # 2. Run your specific ML/Image Processing code
    from torchvision import datasets, transforms
    from torch.utils.data import Dataset
    from PIL import Image

    class MultiViewImageDataset(Dataset):
        def __init__(self, images, transform, num_views=2, class_names=None):
            self.images = images
            self.transform = transform
            self.num_views = num_views
            self.classes = class_names

        def __len__(self):
            return len(self.images)

        def __getitem__(self, idx):
            img = self.images[idx]
            # Generate V different augmented views of the same image
            views = [self.transform(img) for _ in range(self.num_views)]
            views = torch.stack(views, dim=0)  # [V, C, H, W]
            return views

    # CLIP ViT-B/32 transform
    eval_transform = transforms.Compose([
        transforms.Resize(224, interpolation=transforms.InterpolationMode.BICUBIC),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.48145466, 0.4578275, 0.40821073],
            std=[0.26862954, 0.26130258, 0.27577711]
        )
    ])

    # Convert numpy arrays to PIL Images for the dataset
    pil_images = [Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)) for img in images]
    
    import urllib.request

    # Download model if not exists
    model_path = 'https://www.dropbox.com/scl/fi/rpemwr5ywqgcg9lv34mu9/model_clip_with_classes.pth?rlkey=uu8q5cmbwsg5tp0vikkts9e7v&st=dyusop62&dl=1'
    model_filename = "model_clip_with_classes.pth"
    model_dir = Path(__file__).parent / "models"
    model_dir.mkdir(exist_ok=True)
    model_file = model_dir / model_filename

    if not model_file.exists():
        print(f"Downloading model from {model_path}...")
        urllib.request.urlretrieve(model_path, model_file)
        print(f"Model saved to {model_file}")

    # Load model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = torch.load(model_file, map_location=device)
    model.to(device)
    model.eval()
    class_names = model['class_names']
    
    n = min(2, len(images))
    test_data = MultiViewImageDataset(pil_images, eval_transform, num_views=n, class_names=class_names)

    def prepare_inputs_for_model(model, images, collapse_policy='first'):
        """
        Normalize input shape for single-view vs. multi-view models.
        - Multi-view models expect [B, V, C, H, W]
        - Single-view models expect [B, C, H, W]; collapse views if needed.
        """
        is_multiview = getattr(model, "is_multiview_model", False)

        if is_multiview:
            # Ensure batch dimension is present
            if images.dim() == 4:  # [V, C, H, W] from a single sample
                images = images.unsqueeze(0)
            return images

        # Single-view model: collapse any view dimension
        if images.dim() == 5:  # [B, V, C, H, W]
            images = images.mean(dim=1) if collapse_policy == 'mean' else images[:, 0]
        elif images.dim() == 4:  # [V, C, H, W] (single sample with multiple views)
            images = images.mean(dim=0) if collapse_policy == 'mean' else images[0]
            images = images.unsqueeze(0)
        elif images.dim() == 3:  # [C, H, W]
            images = images.unsqueeze(0)

        return images

    import torch.nn.functional as F

    def get_topk_predictions(model, dataset, k=5, index=0, collapse_policy='first'):        
        # Get image (no label needed for inference)
        img = dataset[index]
        img_batch = prepare_inputs_for_model(model, img, collapse_policy=collapse_policy).to(device)

        # Forward pass
        with torch.no_grad():
            logits = model(img_batch)
            probs = F.softmax(logits, dim=1)[0]  # Get probabilities for first batch item
            topk_probs, topk_idx = torch.topk(probs, k=k)

        # Convert to numpy
        topk_probs = topk_probs.cpu().numpy()
        topk_idx = topk_idx.cpu().numpy()

        # Get class names and create result list
        class_names = dataset.classes
        results = []
        for i in range(k):
            results.append({
                "class": class_names[topk_idx[i]],
                "probability": float(topk_probs[i])
            })
    
        return results
    
    # Get predictions for all uploaded images
    all_predictions = []
    for idx in range(len(test_data)):
        predictions = get_topk_predictions(model, test_data, k=5, index=idx)
        all_predictions.append({
            "image_index": idx,
            "predictions": predictions
        })
    
    return all_predictions

@app.post("/analyze")
async def analyze_images(
    prompt: str = Form(...),
    files: List[UploadFile] = File(...)
):
    # Read all file contents as bytes
    images_bytes_list = []
    for file in files:
        content = await file.read()
        images_bytes_list.append(content)
    
    # Pass all images to your custom function
    predictions = process_image_with_notebook_logic(images_bytes_list, prompt)
    
    # Return structured JSON that the webapp can easily parse and display
    return {"predictions": predictions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
