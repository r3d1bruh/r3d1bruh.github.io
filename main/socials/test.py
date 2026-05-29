import os
import glob
from PIL import Image, ImageSequence
from bs4 import BeautifulSoup

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(SCRIPT_DIR, "main", "index.html") # Adjust to your index.html if needed
TARGET_WIDTH = 88

def convert_to_webp(input_path):
    """
    Resizes and converts an animated GIF into an optimized WebP 
    in the exact same directory.
    """
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    webp_output_path = os.path.join(SCRIPT_DIR, f"{base_name}.webp")

    try:
        with Image.open(input_path) as im:
            frames = []
            for frame in ImageSequence.Iterator(im):
                frame_copy = frame.copy()
                
                # Keep the 88px badge grid geometry intact
                if frame_copy.width != TARGET_WIDTH:
                    aspect_ratio = frame_copy.height / frame_copy.width
                    target_height = int(TARGET_WIDTH * aspect_ratio)
                    frame_copy = frame_copy.resize((TARGET_WIDTH, target_height), Image.Resampling.LANCZOS)
                
                frames.append(frame_copy)

            if not frames:
                return None

            # Retain original animation metadata
            duration = im.info.get('duration', 100)
            loop = im.info.get('loop', 0)

            # Save as animated WebP
            frames[0].save(
                webp_output_path,
                save_all=True,
                append_images=frames[1:],
                duration=duration,
                loop=loop,
                quality=75,  # Drastically reduces size while preserving sharpness
                format="WEBP"
            )

            print(f"✅ Converted: {os.path.basename(input_path)} -> {base_name}.webp")
            return {
                "original": os.path.basename(input_path),
                "webp": f"{base_name}.webp"
            }
            
    except Exception as e:
        print(f"❌ Error processing {os.path.basename(input_path)}: {e}")
        return None


def update_html_markup(optimized_maps):
    """
    Updates index.html image sources from .gif to .webp and injects lazy loading.
    Keeps all CSS classes, hover effects, and layout logic completely intact.
    """
    if not os.path.exists(HTML_PATH):
        print(f"⚠️ Could not find HTML file at {HTML_PATH}. Skipping HTML update.")
        return

    with open(HTML_PATH, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    updated_any = False

    for img in soup.find_all('img'):
        src = img.get('src', '')
        img_filename = os.path.basename(src)
        
        # Check if this image matches one of our converted GIFs
        match = next((m for m in optimized_maps if m['original'] == img_filename), None)
        
        if match:
            # Swap source directly to the WebP asset
            img['src'] = src.replace(img_filename, match['webp'])
            # Inject performance-first native lazy loading
            img['loading'] = 'lazy'
            updated_any = True

    if updated_any:
        with open(HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print(f"✨ Successfully updated image sources to WebP in {HTML_PATH}!")
    else:
        print("ℹ️ No matching original image tags found in HTML to update.")


if __name__ == "__main__":
    print("🚀 Starting GIF-to-WebP optimization...")
    
    # Grab all GIFs in the script folder
    gif_files = glob.glob(os.path.join(SCRIPT_DIR, "*.gif"))
    
    processed_results = []
    for file_path in gif_files:
        result = convert_to_webp(file_path)
        if result:
            processed_results.append(result)
            
    if processed_results:
        update_html_markup(processed_results)
    else:
        print("弯 No GIF assets found in this folder to process.")