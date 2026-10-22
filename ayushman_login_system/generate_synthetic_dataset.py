from pathlib import Path
import csv, random, string
from PIL import Image, ImageDraw, ImageFont

random.seed(17)
ROOT = Path("data")
IMG_DIR = ROOT / "synthetic_cards"
IMG_DIR.mkdir(parents=True, exist_ok=True)
(ROOT / "annotations").mkdir(parents=True, exist_ok=True)

first_names = ["Aarav", "Ishita", "Rohan", "Meera", "Kabir", "Anaya", "Dev", "Sana", "Vikram", "Pooja"]
last_names = ["Sharma", "Patil", "Khan", "Verma", "Joshi", "Singh", "More", "Deshmukh"]
labels = []

def fake_id():
    return "DEMO-" + "".join(random.choices(string.digits, k=6))

def make_font(size):
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()

font_title = make_font(24)
font_body = make_font(20)
font_small = make_font(15)

for i in range(120):
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    dob = f"{random.randint(1,28):02d}/{random.randint(1,12):02d}/{random.randint(1960,2005)}"
    gender = random.choice(["Female", "Male", "Other"])
    ref = fake_id()
    # Entirely fictional demo document; not an official card design.
    lines = [
        ("DEMO HEALTH BENEFICIARY CARD — NOT VALID", "header"),
        (f"Beneficiary Name: {name}", "name"),
        (f"Date of Birth: {dob}", "dob"),
        (f"Gender: {gender}", "gender"),
        (f"Reference: {ref}", "reference"),
        ("For software testing only", "other"),
    ]
    img = Image.new("RGB", (900, 520), "#f7fbff")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((18,18,882,502), radius=24, outline="#237a72", width=4)
    d.rectangle((22,22,878,75), fill="#d9f1ec")
    d.text((40,35), "HEALTHLENS AI | SYNTHETIC DEMO", font=font_title, fill="#123b38")
    y = 115
    for line, label in lines:
        d.text((48,y), line, font=font_body if label != "other" else font_small, fill="#182b3a")
        labels.append({"image": f"synthetic_{i:03d}.png", "text": line, "label": label})
        y += 57
    img.save(IMG_DIR / f"synthetic_{i:03d}.png")

csv_path = ROOT / "annotations" / "line_labels.csv"
with csv_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["image", "text", "label"])
    writer.writeheader()
    writer.writerows(labels)

print(f"Created {len(list(IMG_DIR.glob('*.png')))} synthetic demo images.")
print(f"Created {len(labels)} labeled text lines at {csv_path}.")
print("These are fictional examples, not official Ayushman card templates.")
