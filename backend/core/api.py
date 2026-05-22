from django.utils import timezone
from django.shortcuts import get_object_or_404
from typing import List
from ninja import NinjaAPI
from core.models import Application
from core.schemas import ApplicationInSchema, ApplicationOutSchema, ReviewerDecisionSchema

api = NinjaAPI(title="Application Workflow API")


# 1. LIST ALL RECORDS
@api.get("/applications", response=List[ApplicationOutSchema])
def list_applications(request):
    return Application.objects.all().order_by('-created_at')


# 2. CREATE OR UPDATE DRAFT (UPSERT / AUTO-SAVE)
# ⚠️ Must be defined BEFORE /applications/{tracking_number}
# so "draft" is not matched as a tracking_number path parameter
@api.post("/applications/draft", response=ApplicationOutSchema)
def save_application_draft(request, data: ApplicationInSchema):
    # Treat both None and empty string as "new draft"
    tracking_number = data.tracking_number or None

    if tracking_number:
        # Existing draft — update it
        app = get_object_or_404(Application, tracking_number=tracking_number)
        if app.status not in ['Draft', 'Need More Information']:
            return api.create_response(request, {"detail": "This application is locked and cannot be edited."}, status=400)
        app.applicant_name = data.applicant_name
        app.applicant_email = data.applicant_email
        app.company_name = data.company_name
        app.application_type = data.application_type
        app.description = data.description
        app.save()
        return app
    else:
        # New draft — create it and return the generated tracking number
        app = Application.objects.create(
            applicant_name=data.applicant_name,
            applicant_email=data.applicant_email,
            company_name=data.company_name,
            application_type=data.application_type,
            description=data.description,
            status='Draft'
        )
        return app


# 3. VIEW SINGLE RECORD DETAILS
# Dynamic route — must come AFTER all fixed /applications/xxx routes
@api.get("/applications/{tracking_number}", response=ApplicationOutSchema)
def get_application(request, tracking_number: str):
    return get_object_or_404(Application, tracking_number=tracking_number)


# 4. SUBMIT APPLICATION
@api.post("/applications/{tracking_number}/submit")
def submit_application(request, tracking_number: str):
    app = get_object_or_404(Application, tracking_number=tracking_number)
    if app.status not in ['Draft', 'Need More Information']:
        return api.create_response(request, {"detail": "Invalid state transition."}, status=400)
    app.status = 'Submitted'
    app.submitted_at = timezone.now()
    app.save()
    return {"success": True, "status": app.status}


# 5. START REVIEW PHASE
@api.post("/applications/{tracking_number}/start-review")
def start_review(request, tracking_number: str):
    app = get_object_or_404(Application, tracking_number=tracking_number)
    if app.status != 'Submitted':
        return api.create_response(request, {"detail": "Can only review submitted applications."}, status=400)
    app.status = 'Under Review'
    app.save()
    return {"success": True, "status": app.status}


# 6. RECORD REVIEWER DECISION
@api.post("/applications/{tracking_number}/decision")
def record_decision(request, tracking_number: str, payload: ReviewerDecisionSchema):
    app = get_object_or_404(Application, tracking_number=tracking_number)
    if app.status != 'Under Review':
        return api.create_response(request, {"detail": "Application is not currently under review."}, status=400)
    if payload.decision not in ['Approved', 'Need More Information', 'Rejected']:
        return api.create_response(request, {"detail": "Unsupported decision type."}, status=400)
    if payload.decision in ['Need More Information', 'Rejected'] and not payload.comment.strip():
        return api.create_response(request, {"detail": "A comment is required for this decision."}, status=400)
    app.status = payload.decision
    app.reviewer_comment = payload.comment
    app.reviewed_at = timezone.now()
    app.save()
    return {"success": True, "status": app.status}