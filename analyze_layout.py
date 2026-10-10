import cv2
import numpy as np
import os
import pytesseract
from PIL import Image

# Set tesseract path if it's installed in standard locations on Windows
# Common locations:
tess_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\trrah\AppData\Local\Tesseract-OCR\tesseract.exe",
]
for path in tess_paths:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        print(f"Using Tesseract at: {path}")
        break

img = cv2.imread('D:/React Native/Developer-Portfolio/artifacts/mt-core-studio/web.png')
if img is None:
    print("Could not load image.")
    exit(1)

h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Since it's a dark background, background is near 0. Content is bright (e.g. > 15)
# Find row regions where there is content (row_sums > threshold)
row_sums = np.sum(gray > 20, axis=1)
content_rows = np.where(row_sums > 50)[0]

print(f"Image height: {h}, width: {w}")

# Find contiguous content ranges (sections)
if len(content_rows) > 0:
    ranges = []
    start = content_rows[0]
    for i in range(1, len(content_rows)):
        if content_rows[i] > content_rows[i-1] + 30: # Gap of at least 30 pixels of darkness
            ranges.append((start, content_rows[i-1]))
            start = content_rows[i]
    ranges.append((start, content_rows[-1]))
    
    print("\n--- CONTENT RANGES (VERTICAL SECTIONS) ---")
    for idx, (s, e) in enumerate(ranges):
        roi = img[s:e, :]
        mean_bgr = np.mean(roi, axis=(0, 1))
        print(f"Section {idx+1}: Rows {s} to {e} (height {e-s}), Mean BGR: {[int(c) for c in mean_bgr]}")
        
        # Crop and save section to analyze
        sec_crop = img[s:e, :]
        crop_path = f"D:/React Native/Developer-Portfolio/section_{idx+1}.png"
        cv2.imwrite(crop_path, sec_crop)
        print(f"  Saved section to {crop_path}")
        
        # Try OCR if tesseract was found
        try:
            pil_img = Image.fromarray(cv2.cvtColor(sec_crop, cv2.COLOR_BGR2RGB))
            text = pytesseract.image_to_string(pil_img)
            clean_text = "\n".join([line.strip() for line in text.split("\n") if line.strip()])
            if clean_text:
                print("  --- OCR TEXT ---")
                print(clean_text)
                print("  ----------------")
        except Exception as ocr_err:
            pass
            # print(f"  OCR error: {ocr_err}")
