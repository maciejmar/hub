from pydantic import BaseModel, Field


class CatalogAppBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str = Field("", max_length=512)
    url: str = Field(..., max_length=512)
    required_roles: str = Field("", max_length=512, description="Comma-separated role names, e.g. 'hub-admin'")
    sort_order: int = Field(1, ge=1)
    is_active: bool = True
    status: str = Field("active", pattern=r"^(active|orange|gray)$")
    is_system: bool = False


class CatalogAppCreate(CatalogAppBase):
    id: str = Field(..., max_length=64, pattern=r"^[a-z0-9\-]+$")


class CatalogAppUpdate(CatalogAppBase):
    pass


class CatalogAppRead(CatalogAppBase):
    id: str

    model_config = {"from_attributes": True}
