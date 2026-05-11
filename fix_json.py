import re

with open('server/python/comprehensive_evaluation.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
    import numpy as np
    class NpEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, np.integer): return int(obj)
            if isinstance(obj, np.floating): return float(obj)
            if isinstance(obj, np.ndarray): return obj.tolist()
            if isinstance(obj, (bool, np.bool_)): return bool(obj)
            return super(NpEncoder, self).default(obj)
    json.dump(comprehensive_results, f, indent=2, cls=NpEncoder)
"""

# Matches either the original dump or my previous broken attempt
pattern = r'\n\s+(import numpy as np; class NpEncoder.*|json\.dump\(comprehensive_results, f, indent=2\))'
content = re.sub(pattern, replacement, content)

with open('server/python/comprehensive_evaluation.py', 'w', encoding='utf-8') as f:
    f.write(content)
