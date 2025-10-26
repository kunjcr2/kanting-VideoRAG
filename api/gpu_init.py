import os

try:
    import torch
except Exception:
    torch = None

# Fail early with a clear message if PyTorch/CUDA isn't available.
if torch is None:
    raise RuntimeError(
        "PyTorch is not installed. Install a CUDA-enabled PyTorch build (see https://pytorch.org/get-started/locally/)."
    )

if not torch.cuda.is_available():
    # If you want to allow CPU fallback, change this to a warning instead.
    raise RuntimeError(
        "CUDA is not available. Please install GPU drivers and a CUDA-enabled PyTorch. "
        "If you intentionally want to run on CPU, remove or relax api.gpu_init checks."
    )

# Optionally set which GPU to use (default to 0)
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

_DEV = os.environ.get("CUDA_VISIBLE_DEVICES")
print(f"api.gpu_init: using CUDA_VISIBLE_DEVICES={_DEV}")
