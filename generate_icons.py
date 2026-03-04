#!/usr/bin/env python3
"""
Generate PNG icons for the Mobile Simulator Chrome Extension
Run this script to create icon16.png, icon48.png, and icon128.png
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("Error: PIL (Pillow) is required. Install it with:")
    print("  pip install Pillow")
    exit(1)

def create_icon(size):
    """Create a single icon of the specified size"""
    # Create image with blue gradient background
    img = Image.new('RGB', (size, size), '#3b82f6')
    draw = ImageDraw.Draw(img)
    
    # Phone dimensions
    phone_width = int(size * 0.5)
    phone_height = int(size * 0.7)
    phone_x = (size - phone_width) // 2
    phone_y = (size - phone_height) // 2
    radius = int(size * 0.08)
    
    # Draw phone body (dark gray)
    draw.rounded_rectangle(
        [phone_x, phone_y, phone_x + phone_width, phone_y + phone_height],
        radius=radius,
        fill='#1a1a1a'
    )
    
    # Draw screen (white)
    screen_padding = int(size * 0.02)
    screen_radius = int(radius * 0.7)
    draw.rounded_rectangle(
        [
            phone_x + screen_padding,
            phone_y + screen_padding,
            phone_x + phone_width - screen_padding,
            phone_y + phone_height - screen_padding
        ],
        radius=screen_radius,
        fill='#ffffff'
    )
    
    # Draw notch for larger icons
    if size >= 48:
        notch_width = int(phone_width * 0.4)
        notch_height = int(size * 0.04)
        notch_x = phone_x + (phone_width - notch_width) // 2
        notch_y = phone_y + screen_padding
        notch_radius = notch_height // 2
        draw.rounded_rectangle(
            [notch_x, notch_y, notch_x + notch_width, notch_y + notch_height],
            radius=notch_radius,
            fill='#1a1a1a'
        )
    
    return img

def main():
    """Generate all three icon sizes"""
    # Get the icons directory path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'icons')
    
    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)
    
    sizes = [16, 48, 128]
    
    print("Generating icons for Mobile Simulator Chrome Extension...")
    print(f"Output directory: {icons_dir}\n")
    
    for size in sizes:
        filename = f"icon{size}.png"
        filepath = os.path.join(icons_dir, filename)
        
        print(f"Creating {filename}...")
        icon = create_icon(size)
        icon.save(filepath, 'PNG')
        print(f"  ✓ Saved to {filepath}")
    
    print("\n✅ All icons generated successfully!")
    print("\nNext steps:")
    print("1. Go to chrome://extensions/")
    print("2. Click 'Retry' or reload the Mobile Simulator extension")
    print("3. The extension should now load without errors")

if __name__ == '__main__':
    main()
