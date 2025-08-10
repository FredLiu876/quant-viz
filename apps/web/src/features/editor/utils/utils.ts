export const DEFAULT_CODE = `# Write Python here. The Run button is a placeholder for now.
# Press ⌘/Ctrl+Enter to trigger it once it's wired up.
import math
xs = [i/10 for i in range(0, 63)]
ys = [math.sin(x) for x in xs]
print(\"First 5 y values:\", [round(v, 4) for v in ys[:5]])`;
