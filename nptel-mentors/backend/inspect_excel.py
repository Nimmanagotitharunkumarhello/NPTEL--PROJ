
import pandas as pd

file_path = "d:\\github projects\\nptel\\list\\Final Course List (Jan - Apr 2026).xlsx"

try:
    # Read with header at row 3 (0-indexed) which is the 4th row? Or maybe row 4?
    # Let's try reading without header first to see raw rows
    df = pd.read_excel(file_path, header=None)
    print("Rows 5-15:")
    print(df.iloc[5:16])
except Exception as e:
    print(f"Error reading excel: {e}")
