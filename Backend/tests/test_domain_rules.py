"""Tests for registration service domain rules."""
import pytest
from datetime import datetime, timedelta
from app.services import registration_service, event_service, user_service
from app.models import queries


class TestRegistrationDomainRules:
    """Test registration domain rules enforcement."""
    
    def test_cannot_register_for_cancelled_event(self, db):
        """Rule 1: Cannot register for a cancelled event."""
        # Create organizer and event
        org_id = 'org_123'
        att_id = 'att_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        user_service.get_or_create_user_service(db, att_id, 'att@test.com', 'attendee')
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Test Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=10,
            registration_mode='open',
        )
        
        # Cancel the event
        event_service.cancel_event_service(db, org_id, event['id'])
        
        # Try to register - should fail
        with pytest.raises(ValueError, match="cancelled"):
            registration_service.register_attendee_service(db, att_id, event['id'])
    
    def test_cannot_register_for_past_event(self, db):
        """Rule 2: Cannot register for a past event."""
        org_id = 'org_123'
        att_id = 'att_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        user_service.get_or_create_user_service(db, att_id, 'att@test.com', 'attendee')
        
        # Create event in the past
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Past Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() - timedelta(days=1),
            end_datetime=datetime.utcnow() - timedelta(days=1, hours=-2),
            capacity=10,
            registration_mode='open',
        )
        
        # Try to register - should fail
        with pytest.raises(ValueError, match="past"):
            registration_service.register_attendee_service(db, att_id, event['id'])
    
    def test_cannot_register_for_full_event(self, db):
        """Rule 3: Cannot register when event is at full capacity."""
        org_id = 'org_123'
        att_ids = ['att_1', 'att_2']
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        for att_id in att_ids:
            user_service.get_or_create_user_service(db, att_id, f'{att_id}@test.com', 'attendee')
        
        # Create event with capacity = 1
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Small Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=1,
            registration_mode='open',
        )
        
        # Register first attendee - should succeed
        registration_service.register_attendee_service(db, att_ids[0], event['id'])
        
        # Try to register second attendee - should fail
        with pytest.raises(ValueError, match="capacity"):
            registration_service.register_attendee_service(db, att_ids[1], event['id'])
    
    def test_cannot_register_twice(self, db):
        """Rule 4: Cannot register twice for same event."""
        org_id = 'org_123'
        att_id = 'att_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        user_service.get_or_create_user_service(db, att_id, 'att@test.com', 'attendee')
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Test Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=10,
            registration_mode='open',
        )
        
        # Register once
        registration_service.register_attendee_service(db, att_id, event['id'])
        
        # Try to register again - should fail
        with pytest.raises(ValueError, match="already"):
            registration_service.register_attendee_service(db, att_id, event['id'])
    
    def test_open_mode_sets_confirmed_status(self, db):
        """Test that open mode immediately confirms registration."""
        org_id = 'org_123'
        att_id = 'att_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        user_service.get_or_create_user_service(db, att_id, 'att@test.com', 'attendee')
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Open Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=10,
            registration_mode='open',
        )
        
        reg = registration_service.register_attendee_service(db, att_id, event['id'])
        assert reg['status'] == 'confirmed'
    
    def test_shortlist_mode_sets_pending_status(self, db):
        """Test that shortlist mode sets registration to pending."""
        org_id = 'org_123'
        att_id = 'att_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        user_service.get_or_create_user_service(db, att_id, 'att@test.com', 'attendee')
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Shortlist Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=10,
            registration_mode='shortlist',
        )
        
        reg = registration_service.register_attendee_service(db, att_id, event['id'])
        assert reg['status'] == 'pending'
    
    def test_revoked_registration_does_not_count_toward_capacity(self, db):
        """Test that revoked registrations don't count toward capacity."""
        org_id = 'org_123'
        att_ids = ['att_1', 'att_2']
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        for att_id in att_ids:
            user_service.get_or_create_user_service(db, att_id, f'{att_id}@test.com', 'attendee')
        
        # Create event with capacity = 1
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Capacity Test',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=1,
            registration_mode='open',
        )
        
        # Register first attendee
        reg1 = registration_service.register_attendee_service(db, att_ids[0], event['id'])
        
        # Revoke the registration
        registration_service.revoke_registration_service(db, org_id, reg1['id'])
        
        # Now second attendee should be able to register
        reg2 = registration_service.register_attendee_service(db, att_ids[1], event['id'])
        assert reg2['status'] == 'confirmed'


class TestEventDomainRules:
    """Test event domain rules enforcement."""
    
    def test_organizer_cannot_edit_others_event(self, db):
        """Rule 5: Organizer can only edit their own events."""
        org1_id = 'org_1'
        org2_id = 'org_2'
        user_service.get_or_create_user_service(db, org1_id, 'org1@test.com', 'organizer')
        user_service.get_or_create_user_service(db, org2_id, 'org2@test.com', 'organizer')
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=org1_id,
            title='Org 1 Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=10,
            registration_mode='open',
        )
        
        # Try to edit with different organizer
        with pytest.raises(PermissionError):
            event_service.edit_event_service(
                db, org2_id, event['id'], title='New Title'
            )
    
    def test_cannot_edit_cancelled_event(self, db):
        """Rule 6: Cannot edit a cancelled event."""
        org_id = 'org_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Test Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() + timedelta(days=7),
            end_datetime=datetime.utcnow() + timedelta(days=7, hours=2),
            capacity=10,
            registration_mode='open',
        )
        
        # Cancel event
        event_service.cancel_event_service(db, org_id, event['id'])
        
        # Try to edit - should fail
        with pytest.raises(ValueError, match="cancelled"):
            event_service.edit_event_service(
                db, org_id, event['id'], title='New Title'
            )
    
    def test_cannot_edit_past_event(self, db):
        """Rule 7: Cannot edit an event whose start_datetime has passed."""
        org_id = 'org_123'
        user_service.get_or_create_user_service(db, org_id, 'org@test.com', 'organizer')
        
        # Create event that has already started
        event = event_service.create_event_service(
            db=db,
            organizer_id=org_id,
            title='Past Event',
            description='Test',
            location='NYC',
            start_datetime=datetime.utcnow() - timedelta(hours=1),
            end_datetime=datetime.utcnow() + timedelta(hours=1),
            capacity=10,
            registration_mode='open',
        )
        
        # Try to edit - should fail
        with pytest.raises(ValueError, match="already started"):
            event_service.edit_event_service(
                db, org_id, event['id'], title='New Title'
            )
