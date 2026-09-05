import numpy as np
from typing import List, Tuple

class SimpleLogisticFederatedModel:
    """
    Standardized, lightweight linear model with sigmoid activation for stockout risk classification.
    Parameter weights can be meaningfully averaged via FedAvg across state silos.
    Features: [normalized_lag7, normalized_rolling14, outbreak_flag, is_weekend, stock_to_consumption_ratio]
    """
    def __init__(self, num_features: int = 5):
        self.weights = np.zeros(num_features, dtype=np.float32)
        self.bias = 0.0

    def get_weights(self) -> List[np.ndarray]:
        return [self.weights.copy(), np.array([self.bias], dtype=np.float32)]

    def set_weights(self, weights: List[np.ndarray]):
        self.weights = weights[0].astype(np.float32)
        self.bias = float(weights[1][0])

    def sigmoid(self, z: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-np.clip(z, -25.0, 25.0)))

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        z = np.dot(X, self.weights) + self.bias
        return self.sigmoid(z)

    def train_step(self, X: np.ndarray, y: np.ndarray, lr: float = 0.05, epochs: int = 5):
        m = len(X)
        if m == 0:
            return
        for _ in range(epochs):
            preds = self.predict_proba(X)
            errors = preds - y
            grad_w = np.dot(X.T, errors) / m
            grad_b = np.sum(errors) / m
            self.weights -= lr * grad_w
            self.bias -= lr * grad_b

    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Tuple[float, float]:
        if len(X) == 0:
            return 0.5, 0.5
        preds = self.predict_proba(X)
        # Binary cross-entropy loss
        eps = 1e-7
        loss = -float(np.mean(y * np.log(preds + eps) + (1 - y) * np.log(1 - preds + eps)))
        accuracy = float(np.mean((preds >= 0.5) == (y == 1)))
        return loss, accuracy
