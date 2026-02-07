
import pandas as pd

file_path = "d:\\github projects\\nptel\\list\\Final Course List (Jan - Apr 2026).xlsx"

try:
    df = pd.read_excel(file_path, header=None)
    
    # Iterate through first 20 rows
    for i, row in df.head(20).iterrows():
        # Convert row to string and search for "Course Name"
        row_str = str(row.values)
        if "Course Name" in row_str:
            print(f"FOUND HEADER AT ROW INDEX: {i}")
            print("Row content:", row.values)
            break
            
except Exception as e:
    print(f"Error reading excel: {e}")
