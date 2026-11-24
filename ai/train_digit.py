# ==============================================================
# 파일   ai\train_digit.py — 학습 파일 (터미널 ③ 에서 한 번 실행)
# 흐름   MNIST 6만 장 다운로드 → CNN 2 epoch 학습 → models\digit_cnn.pt
#        → digit.py(서버)는 이 파일을 불러 예측만 한다
# 같이 씀  DigitCNN · MODELS → digit.py 가 import
# ==============================================================
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

BASE = Path(__file__).parent
MODELS = BASE / "models"


# CNN — 28×28 흑백 → 합성곱 2번 → 숫자 10개 점수
class DigitCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),    # 16 × 14 × 14
            nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),   # 32 × 7 × 7
        )
        self.classifier = nn.Sequential(
            nn.Flatten(), nn.Linear(32 * 7 * 7, 64), nn.ReLU(), nn.Linear(64, 10),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


if __name__ == "__main__":
    torch.manual_seed(42)
    MODELS.mkdir(exist_ok=True)

    tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    train_ds = datasets.MNIST(BASE / "data", train=True, download=True, transform=tf)   # 처음 한 번 다운로드
    test_ds = datasets.MNIST(BASE / "data", train=False, download=True, transform=tf)
    train_loader = DataLoader(train_ds, batch_size=128, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=1000)

    print("===== 1. 데이터 =====")
    print("학습:", len(train_ds), "/ 시험:", len(test_ds))

    model = DigitCNN()
    loss_fn = nn.CrossEntropyLoss()
    opt = torch.optim.Adam(model.parameters(), lr=0.001)

    print("\n===== 2. CNN 학습 (2 epoch, CPU 1~3분) =====")
    for epoch in range(1, 3):
        model.train()
        for x, y in train_loader:
            loss = loss_fn(model(x), y)
            opt.zero_grad()
            loss.backward()
            opt.step()
        model.eval()
        correct = 0
        with torch.no_grad():
            for x, y in test_loader:
                correct += (model(x).argmax(1) == y).sum().item()
        print(f"epoch {epoch}  loss {loss.item():.4f}  시험 정확도 {correct / len(test_ds):.4f}")

    torch.save(model.state_dict(), MODELS / "digit_cnn.pt")
    print("\n===== 3. 저장 =====")
    print("models/digit_cnn.pt")