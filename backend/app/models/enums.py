import enum

class StaffStatusEnum(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"

class SeverityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RecommendationStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class TransferStatusEnum(str, enum.Enum):
    APPROVED = "approved"
    DISPATCHED = "dispatched"
    RECEIVED = "received"

class UserRoleEnum(str, enum.Enum):
    PHC_STAFF = "phc_staff"
    DISTRICT_OFFICER = "district_officer"
    STATE_OFFICER = "state_officer"
    NATIONAL_ADMIN = "national_admin"

class ModelTypeEnum(str, enum.Enum):
    XGBOOST = "xgboost"
    FEDERATED_BASE = "federated_base"
