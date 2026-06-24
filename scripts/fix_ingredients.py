import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.product import Product

def fix_ingredients():
    db = SessionLocal()
    products = db.query(Product).all()
    fixed = 0

    for p in products:
        if not p.key_ingredients:
            continue
        
        first = p.key_ingredients[0]
        
        # Check if first ingredient has [' or [" prefix
        if first.startswith("['") or first.startswith('["') or first.startswith("["):
            new_ings = list(p.key_ingredients)
            
            # Clean first ingredient
            new_ings[0] = first.lstrip("[").lstrip("'").lstrip('"').strip()
            
            # Clean last ingredient
            last = new_ings[-1]
            new_ings[-1] = last.rstrip("]").rstrip("'").rstrip('"').strip()
            
            # Remove empty strings
            p.key_ingredients = [i for i in new_ings if i.strip()]
            fixed += 1

    db.commit()
    print(f"Fixed {fixed} products")
    db.close()

if __name__ == "__main__":
    fix_ingredients()