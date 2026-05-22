import random
import string
from django.db import models

class Application(models.Model):
    TYPE_CHOICES = [
        ('Recordation', 'Recordation'),
        ('Renewal', 'Renewal'),
        ('Change of Ownership', 'Change of Ownership'),
        ('Change of Name', 'Change of Name'),
        ('Discontinuation', 'Discontinuation'),
    ]

    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Submitted', 'Submitted'),
        ('Under Review', 'Under Review'),
        ('Need More Information', 'Need More Information'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    applicant_name = models.CharField(max_length=150)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=150)
    application_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Draft')
    reviewer_comment = models.TextField(blank=True, default="")

    # Workflow Timestamps Ledger
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            prefix = "TRK-"
            letters = "".join(random.choices(string.ascii_uppercase, k=3))
            numbers = "".join(random.choices(string.digits, k=5))
            self.tracking_number = f"{prefix}{letters}{numbers}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tracking_number} - {self.company_name} ({self.status})"