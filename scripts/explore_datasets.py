import pandas as pd
import json

print("=" * 50)
print("INCI INGREDIENTS LIST")
print("=" * 50)
df_inci = pd.read_csv("scripts/data/ingredientsList.csv")
print(df_inci.columns.tolist())
print(df_inci.head(3))

print("\n" + "=" * 50)
print("KINGABZPRO COSMETICS")
print("=" * 50)
df_king = pd.read_csv("scripts/data/cosmetics.csv")
print(df_king.columns.tolist())
print(df_king.head(3))

print("\n" + "=" * 50)
print("EWARD96 SKINCARE PRODUCTS")
print("=" * 50)
df_eward = pd.read_csv("scripts/data/skincare_products.csv")
print(df_eward.columns.tolist())
print(df_eward.head(3))

print("\n" + "=" * 50)
print("DERMSTORE JSON")
print("=" * 50)
with open("scripts/data/dermstore_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
if isinstance(data, list):
    print("Type: list of objects")
    print("Keys:", list(data[0].keys()))
    print("Sample:", data[0])
elif isinstance(data, dict):
    print("Type: dict")
    print("Keys:", list(data.keys()))