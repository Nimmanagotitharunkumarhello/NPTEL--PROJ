
import pandas as pd

file_path = "d:\\github projects\\nptel\\list\\Final Course List (Jan - Apr 2026).xlsx"

try:
    df = pd.read_excel(file_path, header=10) # Use row 10 as header
    print("Columns found:")
    for col in df.columns:
        print(f"'{col}'")
            
except Exception as e:
    print(f"Error reading excel: {e}")
