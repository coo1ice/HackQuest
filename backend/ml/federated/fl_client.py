import flwr as fl
import numpy as np
from typing import List, Tuple, Dict
from ml.federated.model_def import SimpleLogisticFederatedModel

class PHCFederatedClient(fl.client.NumPyClient):
    """
    Flower NumPyClient representing a State-level healthcare data silo.
    Trains only on its local PHC features and returns updated model weights
    without transmitting any raw patient or facility-level data.
    """
    def __init__(self, client_id: str, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray):
        self.client_id = client_id
        self.X_train = X_train
        self.y_train = y_train
        self.X_val = X_val
        self.y_val = y_val
        self.model = SimpleLogisticFederatedModel(num_features=X_train.shape[1] if len(X_train) > 0 else 5)

    def get_parameters(self, config: Dict[str, str]) -> List[np.ndarray]:
        return self.model.get_weights()

    def fit(self, parameters: List[np.ndarray], config: Dict[str, str]) -> Tuple[List[np.ndarray], int, Dict]:
        self.model.set_weights(parameters)
        epochs = int(config.get("local_epochs", 3))
        lr = float(config.get("lr", 0.05))
        self.model.train_step(self.X_train, self.y_train, lr=lr, epochs=epochs)
        loss, acc = self.model.evaluate(self.X_train, self.y_train)
        return self.model.get_weights(), len(self.X_train), {"train_loss": loss, "train_acc": acc}

    def evaluate(self, parameters: List[np.ndarray], config: Dict[str, str]) -> Tuple[float, int, Dict]:
        self.model.set_weights(parameters)
        loss, acc = self.model.evaluate(self.X_val, self.y_val)
        return float(loss), len(self.X_val), {"accuracy": float(acc)}
