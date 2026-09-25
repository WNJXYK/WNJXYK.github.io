# On the Learnability of Test-Time Adaptation

> A Recovery Complexity Perspective — **ICML 2026**

📄 **Paper:** <https://arxiv.org/abs/2605.28057>
🌐 **Project page:** <https://zhouz.dev/TTA-Learnability/>

---

## Overview

Test-time adaptation (TTA) adapts a model to distribution shifts at test time using **only unlabeled data**. Despite its empirical success, the **learnability** of TTA under non-stationary streams remains unexplored.

This work proposes the first principled theoretical framework for studying when TTA is learnable, introducing two new notions:

- **(ε, δ)-Recovery Complexity** — the post-shift time needed to maintain excess risk below a target level with high probability.
- **(ε, ρ)-TTA Learnability** — a global, stream-level reliability measure controlling the fraction of time steps that violate the target.

Within a unified stream model (Wasserstein-quantized distribution shifts + φ-mixing temporal dependence), we derive **order-wise matching** minimax lower and upper bounds on recovery complexity, revealing an intrinsic *adaptivity–information trade-off*. We further bridge local recovery to global learnability and connect it to dynamic regret.

## Resources

- 📄 **Paper:** <https://arxiv.org/abs/2605.28057>
- 🖼 **Poster:** [assets/poster.pdf](assets/poster.pdf)
- 🎬 **Slides:** [assets/slides.pdf](assets/slides.pdf)
- 🌐 **Project page:** <https://zhouz.dev/TTA-Learnability/>

## BibTeX

```bibtex
@inproceedings{zhou26learnability,
  author    = {Zhi Zhou and Ming Yang and Shi-Yu Tian and Kun-Yang Yu and Lan-Zhe Guo and Yu-Feng Li},
  title     = {On the Learnability of Test-Time Adaptation: A Recovery Complexity Perspective},
  booktitle = {Proceedings of the 43rd International Conference on Machine Learning (ICML)},
  year      = {2026}
}
```

