import json
from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
import uuid
from datetime import datetime
from app.database import engine
from app.models.audit import AuditLog, ActionEnum

def get_state_changes(obj):
    changes = {}
    for attr in obj.__mapper__.columns.keys():
        hist = get_history(obj, attr)
        if hist.has_changes():
            old = hist.deleted[0] if hist.deleted else None
            new = hist.added[0] if hist.added else None
            # Basic serialization trick
            if isinstance(old, (uuid.UUID, datetime)): old = str(old)
            if isinstance(new, (uuid.UUID, datetime)): new = str(new)
            changes[attr] = {"old": old, "new": new}
    return changes

def receive_after_flush(session, flush_context):
    audit_records = []
    
    for obj in session.new:
        if isinstance(obj, AuditLog):
            continue
        audit_records.append(AuditLog(
            action=ActionEnum.CREATE,
            entity_name=obj.__class__.__name__,
            entity_id=str(getattr(obj, 'id', '')),
            changes={"new": "created"}
        ))
        
    for obj in session.dirty:
        if isinstance(obj, AuditLog) or not session.is_modified(obj):
            continue
        changes = get_state_changes(obj)
        if changes:
             audit_records.append(AuditLog(
                 action=ActionEnum.UPDATE,
                 entity_name=obj.__class__.__name__,
                 entity_id=str(getattr(obj, 'id', '')),
                 changes=changes
             ))
             
    for obj in session.deleted:
        if isinstance(obj, AuditLog):
            continue
        audit_records.append(AuditLog(
            action=ActionEnum.DELETE,
            entity_name=obj.__class__.__name__,
            entity_id=str(getattr(obj, 'id', '')),
            changes={"deleted": True}
        ))
        
    if audit_records:
        session.add_all(audit_records)

def register_audit_listeners():
    # Only register for Sessions mapping to our Base
    from app.database import AsyncSessionLocal
    # In async sqlalchemy, event listeners are attached to the Sync session underlying it.
    from sqlalchemy.orm import Session
    event.listen(Session, "after_flush", receive_after_flush)
