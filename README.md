# TrustChain - Multi-Industry RWA Tracking on Sui Blockchain

A production-ready application demonstrating immutable audit trails for real-world assets across aviation and construction/seismic monitoring industries, built on Sui blockchain.

## Overview

TrustChain leverages Sui's object-centric model to create tamper-proof tracking systems for critical infrastructure. Each physical asset becomes a living on-chain object with complete lifecycle tracking, sensor data, and maintenance history.

### Supported Industries

- **Aviation**: Track aircraft, parts, flight hours, and maintenance requirements
- **Construction/Seismic**: Monitor buildings, structural columns, and seismic sensor readings

## Why Sui?

1. **Object-Centric Model**: Native support for hierarchical relationships (Aircraft → Parts, Building → Columns)
2. **Dynamic Fields**: Store unlimited sensor data without state bloat
3. **Cost Efficiency**: Pennies per transaction vs thousands on Ethereum
4. **Programmable Ownership**: Built-in transfer policies and multi-sig support

## Tech Stack

**Smart Contracts:**
- Sui Move
- Modules: `aircraft`, `part`, `building`, `column`

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- @mysten/dapp-kit (Sui wallet integration)
- @tanstack/react-query

**Network:**
- Sui Devnet
- Published Package ID: `0xd545d3b775a14ee9c53386859074f497c06196e1b931b93f1eb053dc272ea439`

## Quick Start

### Prerequisites

- Node.js 20+
- Sui Wallet browser extension
- (Optional) Sui CLI for creating test data

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd trustchain-sui

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Using the Application

1. **Install Sui Wallet**: Add the Sui Wallet browser extension
2. **Connect Wallet**: Click "Connect Wallet" in the app
3. **Switch to Devnet**: Ensure your wallet is on Devnet network
4. **Create Assets**: Use the "Create Asset" buttons to add aircraft, parts, buildings, or columns
5. **View Dashboard**: Monitor your assets, maintenance alerts, and structural warnings

### Environment Configuration

The frontend uses the following environment variable (already configured):

**frontend/.env**
```
VITE_PACKAGE_ID=0xd545d3b775a14ee9c53386859074f497c06196e1b931b93f1eb053dc272ea439
```

## Creating Test Data (Optional)

If you want to populate the app with sample data:

### Prerequisites for Test Data
- Sui CLI installed
- Wallet configured with devnet SUI tokens

### Aviation Test Data

```bash
# Creates 3 aircraft and 5 parts with various maintenance statuses
./scripts/create-aviation-test-data.sh
```

This creates:
- 3 Aircraft (Boeing 737, Boeing 777, Airbus A320)
- 5 Parts with different maintenance alerts
- Maintenance scenarios (overdue, warning, OK)

### Seismic/Construction Test Data

```bash
# Creates 2 buildings and 4 columns with sensor readings
./scripts/create-seismic-test-data.sh
```

This creates:
- 2 Buildings in different risk zones
- 4 Structural columns with various alert statuses
- Seismic events and sensor readings
- Critical/warning/normal status examples

## Features

### Aviation Dashboard
- Track aircraft fleet with tail numbers and models
- Monitor parts and their maintenance schedules
- Flight hours tracking
- Maintenance alerts for overdue parts
- Attach/detach parts to/from aircraft
- Complete audit trail

### Construction/Seismic Dashboard
- Monitor buildings in different seismic risk zones
- Track structural columns with sensor data
- Real-time anomaly detection
- Critical/warning alerts for structural issues
- Seismic event logging
- Tilt, vibration, and crack width monitoring

### Key Capabilities
- **Immutable Records**: All data stored on-chain, tamper-proof
- **Parent-Child Relationships**: Parts attach to aircraft, columns to buildings
- **Sensor Data**: Dynamic fields for unlimited sensor readings
- **Alert System**: Automated warnings based on thresholds
- **Multi-Industry**: Unified platform for different asset types

## Project Structure

```
trustchain-sui/
├── move/                          # Sui Move smart contracts
│   ├── sources/
│   │   ├── aircraft.move         # Aircraft tracking
│   │   ├── part.move            # Aviation parts
│   │   ├── building.move        # Building tracking
│   │   └── column.move          # Structural columns
│   └── Move.toml
├── frontend/                      # React frontend application
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/              # Dashboard pages
│   │   ├── lib/                # Utilities
│   │   └── main.tsx           # App entry point
│   ├── .env                    # Environment config
│   └── package.json
└── scripts/                      # Test data creation scripts
    ├── create-aviation-test-data.sh
    └── create-seismic-test-data.sh
```

## Smart Contract Modules

### Aircraft Module
- `create_aircraft`: Create new aircraft object
- `complete_flight`: Log flight hours
- `update_status`: Change aircraft status

### Part Module
- `create_part`: Create aviation part
- `attach_to_parent`: Attach part to aircraft
- `update_flight_hours`: Update flight hours
- `update_status`: Change part status
- Automatic maintenance due calculation

### Building Module
- `create_building`: Create building object
- `record_seismic_event`: Log seismic events
- `update_status`: Change building status

### Column Module
- `create_column`: Create structural column
- `attach_to_building`: Attach column to building
- `add_seismic_reading`: Add sensor readings
- Automatic anomaly detection based on thresholds

## Development

### Running the Frontend

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
cd frontend
npm run build
```

### Publishing Smart Contracts

```bash
cd move
sui client publish --gas-budget 100000000
```

## Demo Wallet (For Testing)

The application comes with test data already deployed on devnet. To access it:

**Recovery Phrase:**
```
pudding knife process vast use bracket color emerge burger knife wide roof
```

**Address:** `0x5787fc7fc6bcf1bdf3fc945f5dc0abe533dd4e25213428335e47b495cd35a2db`

Import this wallet to see existing test assets.

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
