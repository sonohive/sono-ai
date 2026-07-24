import traceback

try:
    import main
    print("Successfully imported main")
except Exception as e:
    print("Error importing main:")
    traceback.print_exc()
