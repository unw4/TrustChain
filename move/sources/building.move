module trustchain::building {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;
    use sui::vec_set::{Self, VecSet};
    use sui::dynamic_field as df;
    use std::string::String;

    // Building object - represents a structure being monitored
    public struct Building has key, store {
        id: UID,
        building_name: String,      // "Istanbul Plaza Tower A"
        location: String,            // "Istanbul, Turkey"
        construction_year: u64,
        building_type: String,       // "Residential", "Commercial", "Hospital", etc.
        num_floors: u64,
        operator: address,
        status: String,              // active, under_inspection, condemned
        last_inspection_date: u64,
        seismic_zone: String,        // "High Risk", "Medium Risk", "Low Risk"
        authorized_inspectors: VecSet<address>,
    }

    // Events
    public struct BuildingCreated has copy, drop {
        building_id: ID,
        building_name: String,
        location: String,
        seismic_zone: String,
        operator: address,
    }

    public struct InspectionCompleted has copy, drop {
        building_id: ID,
        inspection_date: u64,
        inspector: address,
    }

    public struct BuildingStatusChanged has copy, drop {
        building_id: ID,
        old_status: String,
        new_status: String,
        timestamp: u64,
    }

    public struct SeismicEventRecorded has copy, drop {
        building_id: ID,
        magnitude: u64,  // Magnitude * 10 (e.g., 65 = 6.5)
        timestamp: u64,
        damage_detected: bool,
    }

    // Create new building
    public entry fun create_building(
        building_name: String,
        location: String,
        construction_year: u64,
        building_type: String,
        num_floors: u64,
        seismic_zone: String,
        ctx: &mut TxContext
    ) {
        let building_id = object::new(ctx);
        let building_id_copy = object::uid_to_inner(&building_id);

        let building = Building {
            id: building_id,
            building_name,
            location,
            construction_year,
            building_type,
            num_floors,
            operator: sender(ctx),
            status: std::string::utf8(b"active"),
            last_inspection_date: 0,
            seismic_zone,
            authorized_inspectors: vec_set::empty(),
        };

        sui::event::emit(BuildingCreated {
            building_id: building_id_copy,
            building_name: building.building_name,
            location: building.location,
            seismic_zone: building.seismic_zone,
            operator: sender(ctx),
        });

        transfer::public_transfer(building, sender(ctx));
    }

    // Record inspection
    public entry fun record_inspection(
        building: &mut Building,
        inspection_date: u64,
        ctx: &mut TxContext
    ) {
        let inspector = sender(ctx);
        assert!(
            building.operator == inspector || vec_set::contains(&building.authorized_inspectors, &inspector),
            0
        );

        building.last_inspection_date = inspection_date;

        sui::event::emit(InspectionCompleted {
            building_id: object::uid_to_inner(&building.id),
            inspection_date,
            inspector,
        });
    }

    // Record seismic event
    public entry fun record_seismic_event(
        building: &mut Building,
        magnitude: u64,
        timestamp: u64,
        damage_detected: bool,
        _ctx: &mut TxContext
    ) {
        // Store event as dynamic field
        df::add(&mut building.id, timestamp, magnitude);

        sui::event::emit(SeismicEventRecorded {
            building_id: object::uid_to_inner(&building.id),
            magnitude,
            timestamp,
            damage_detected,
        });

        // Auto-change status if damage detected
        if (damage_detected && building.status == std::string::utf8(b"active")) {
            building.status = std::string::utf8(b"under_inspection");
        };
    }

    // Change building status
    public entry fun change_status(
        building: &mut Building,
        new_status: String,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        assert!(building.operator == sender(ctx), 0);

        let old_status = building.status;
        building.status = new_status;

        sui::event::emit(BuildingStatusChanged {
            building_id: object::uid_to_inner(&building.id),
            old_status,
            new_status: building.status,
            timestamp,
        });
    }

    // Add authorized inspector
    public entry fun add_authorized_inspector(
        building: &mut Building,
        inspector: address,
        ctx: &mut TxContext
    ) {
        assert!(building.operator == sender(ctx), 0);
        vec_set::insert(&mut building.authorized_inspectors, inspector);
    }

    // Register column to building (stores column ID)
    public entry fun register_column(
        building: &mut Building,
        column_id: ID,
        _ctx: &mut TxContext
    ) {
        df::add(&mut building.id, column_id, true);
    }

    // Getters
    public fun building_name(building: &Building): String {
        building.building_name
    }

    public fun location(building: &Building): String {
        building.location
    }

    public fun status(building: &Building): String {
        building.status
    }

    public fun seismic_zone(building: &Building): String {
        building.seismic_zone
    }

    public fun num_floors(building: &Building): u64 {
        building.num_floors
    }
}
