from ninja import Schema
from typing import Optional
from datetime import datetime


class ApplicationInSchema(Schema):
    # Optional — will be None on new drafts, populated on updates
    tracking_number: Optional[str] = None
    applicant_name: str = ""
    applicant_email: str = ""
    company_name: str = ""
    application_type: str = "Recordation"
    description: str = ""


class ApplicationOutSchema(Schema):
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str
    status: str
    reviewer_comment: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None


class ReviewerDecisionSchema(Schema):
    decision: str
    comment: str = ""