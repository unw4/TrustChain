module trustchain::aircraft {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;
    use sui::vec_set::{Self, VecSet};
    use sui::dynamic_field as df;
    use std::string::String;

    // Aircraft object - top-level asset
    public struct Aircraft has key, store {
        id: UID,
        tail_number: String,      // N12345
        model: String,            // Boeing 737-800
        manufacturer: String,     // Boeing
        manufacture_date: u64,
        operator: address,
        status: String,           // active, grounded, maintenance
        total_flight_hours: u64,
        total_cycles: u64,        // Takeoff/landing cycles
        authorized_operators: VecSet<address>,
    }

    // Events
    public struct AircraftCreated has copy, drop {
        aircraft_id: ID,
        tail_number: String,
        model: String,
        manufacturer: String,
        operator: address,
    }

    public struct FlightCompleted has copy, drop {
        aircraft_id: ID,
        flight_hours: u64,
        timestamp: u64,
    }

    public struct AircraftStatusChanged has copy, drop {
        aircraft_id: ID,
        old_status: String,
        new_status: String,
        timestamp: u64,
    }

    // Create new aircraft
    public entry fun create_aircraft(
        tail_number: String,
        model: String,
        manufacturer: String,
        manufacture_date: u64,
        ctx: &mut TxContext
    ) {
        let aircraft_id = object::new(ctx);
        let aircraft_id_copy = object::uid_to_inner(&aircraft_id);

        let aircraft = Aircraft {
            id: aircraft_id,
            tail_number,
            model,
            manufacturer,
            manufacture_date,
            operator: sender(ctx),
            status: std::string::utf8(b"active"),
            total_flight_hours: 0,
            total_cycles: 0,
            authorized_operators: vec_set::empty(),
        };

        sui::event::emit(AircraftCreated {
            aircraft_id: aircraft_id_copy,
            tail_number: aircraft.tail_number,
            model: aircraft.model,
            manufacturer: aircraft.manufacturer,
            operator: sender(ctx),
        });

        transfer::public_transfer(aircraft, sender(ctx));
    }

    // Record flight completion
    public entry fun complete_flight(
        aircraft: &mut Aircraft,
        flight_hours: u64,
        timestamp: u64,
        _ctx: &mut TxContext
    ) {
        aircraft.total_flight_hours = aircraft.total_flight_hours + flight_hours;
        aircraft.total_cycles = aircraft.total_cycles + 1;

        sui::event::emit(FlightCompleted {
            aircraft_id: object::uid_to_inner(&aircraft.id),
            flight_hours,
            timestamp,
        });
    }

    // Change aircraft status
    public entry fun change_status(
        aircraft: &mut Aircraft,
        new_status: String,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        assert!(aircraft.operator == sender(ctx), 0);

        let old_status = aircraft.status;
        aircraft.status = new_status;

        sui::event::emit(AircraftStatusChanged {
            aircraft_id: object::uid_to_inner(&aircraft.id),
            old_status,
            new_status: aircraft.status,
            timestamp,
        });
    }

    // Add authorized operator
    public entry fun add_authorized_operator(
        aircraft: &mut Aircraft,
        operator: address,
        ctx: &mut TxContext
    ) {
        assert!(aircraft.operator == sender(ctx), 0);
        vec_set::insert(&mut aircraft.authorized_operators, operator);
    }

    // Attach part to aircraft (stores part ID)
    public entry fun register_part(
        aircraft: &mut Aircraft,
        part_id: ID,
        _ctx: &mut TxContext
    ) {
        // Store part ID as dynamic field
        df::add(&mut aircraft.id, part_id, true);
    }

    // Getters
    public fun tail_number(aircraft: &Aircraft): String {
        aircraft.tail_number
    }

    public fun model(aircraft: &Aircraft): String {
        aircraft.model
    }

    public fun manufacturer(aircraft: &Aircraft): String {
        aircraft.manufacturer
    }

    public fun status(aircraft: &Aircraft): String {
        aircraft.status
    }

    public fun total_flight_hours(aircraft: &Aircraft): u64 {
        aircraft.total_flight_hours
    }

    public fun total_cycles(aircraft: &Aircraft): u64 {
        aircraft.total_cycles
    }
}
