# LSevin

## Introduction
This document outlines the architecture for LSevin, a modular monolith automation platform for beauty, healthcare, and tourism services. The system follows Domain-Driven Design principles with clear bounded contexts.

## Shared Kernel

### Strongly Typed IDs
```plaintext
- UserId : StronglyTyped<Guid>
- CustomerId : StronglyTyped<Guid>
- ProviderId : StronglyTyped<Guid>
- ServiceId : StronglyTyped<Guid>
- StaffId : StronglyTyped<Guid>
- BookingId : StronglyTyped<Guid>
- TransactionId : StronglyTyped<Guid>
- TravelPackageId : StronglyTyped<Guid>
```

### Value Objects
```plaintext
Money
- Amount (decimal)
- Currency

Address
- Country
- City
- Street
- PostalCode
- Details (string)

PersonName
- FirstName
- LastName

TimeSlot
- StartTime
- EndTime
- TimeZone

DateRange
- StartDate
- EndDate

TravelRoute
- Origin (Address)
- Destination (Address)
- Distance
- Duration

RoomDetails
- Type (enum RoomType)
- Capacity
- Amenities
```

### Enums
```plaintext
Currency
- USD
- EUR
- GBP

ProviderType
- Hospital
- Clinic
- Hotel
- BeautyCenter
- Airline
- TransportCompany

StaffType
- Doctor
- Beautician
- HotelStaff
- FlightCrew

ServiceType
- Medical
- Beauty
- Tourism
- Transportation
- Accommodation

EntityStatus
- Active
- Inactive
- Suspended

PaymentStatus
- Pending
- Processing
- Completed
- Failed
- Refunded

BookingStatus
- Draft
- Confirmed
- InProgress
- Completed
- Cancelled

TravelStatus
- Planned
- Booked
- InProgress
- Completed
- Cancelled

RoomType
- Single
- Double
- Suite
- Deluxe

TransportationType
- Flight
- Train
- Bus
- Taxi

PaymentMethod
- CreditCard
- BankTransfer

Gender
- Male
- Female
- Other

DocumentType
- Passport
- Visa
- DriverLicense
- IDCard
- MedicalCertificate
- Other

LocationType
- Country
- City
```

## Modules

### 1. Identity Module (AuthContext)
```plaintext
User (Root)
- UserId
- Email
- Password
- UserProfile (Entity)
  - PersonName (VO)
  - ContactInformation (VO)
- Status
- CreatedAt
- UpdatedAt

Role (Root)
- RoleId
- Name
- Permissions (Entity)
  - PermissionId
  - Name
  - Resource
  - Action
- Status
```

**Domain Events & Impacts:**
- UserRegistered
  > Triggers customer profile creation
  > Initializes default preferences
- UserActivated
  > Enables service access
- UserDeactivated
  > Suspends all active bookings
  > Notifies relevant providers
- RoleAssigned
  > Updates user permissions
- PermissionsUpdated
  > Updates access control across modules

**Description:** Manages user authentication and authorization, serving as the foundation for user access across the system.

### 2. Customer Module (CustomerContext)
```plaintext
CustomerProfile (Root)
- CustomerId (links to UserId)
- DateOfBirth
- Gender
- Address
- PhoneNumber
- Email
- PreferredLanguage
- Documents (Entity)
  - DocumentId
  - DocumentType
  - DocumentUrl
- Status
- CreatedAt
- UpdatedAt

CustomerPreferences (Root)
- CustomerId
- FavoriteServiceTypes (Entity)
  - ServiceTypeId
  - Priority (1-5)
  - AddedDate

ServiceHistory (Root)
- CustomerId
- HistoryEntries (Entity)
  - EntryId
  - ServiceId (optional)
  - ProviderId
  - StaffId (optional)
  - Date
  - Notes
  - RelatedDocuments
  - Status
```

**Domain Events & Impacts:**
- CustomerProfileCreated
  > Initializes recommendation process
- CustomerProfileUpdated
  > Updates relevant service providers
- PreferencesUpdated
  > Triggers recommendation recalculation
- TravelPreferencesUpdated
  > Updates travel recommendations
- ServiceHistoryAdded
  > Updates customer profile
  > Updates provider ratings

### 3. Service Module (ServiceContext)
```plaintext
ServiceProvider (Root)
- BaseInfo (VO)
  - ProviderId
  - Name
  - Description
  - ProviderType
  - Status
- Location (VO)
- ProviderProfile (Entity)
  - Certifications
  - Rating
  - Amenities
  - ExtendedAttributes
  - OperatingHours
- ServiceAssignments (Entity)
  - ServiceId
  - CustomPricing (VO)
  - Availability
  - SpecificRequirements

Staff (Root)
- StaffId
- PersonalInfo (VO)
- StaffType
- Credentials (Entity)
- Experience (Entity)
- ProviderAssignments (Entity)
- Status

Service (Root)
- ServiceId
- BaseInfo (VO)
- Requirements (Entity)
- BasePrice (VO)
- DefaultAvailability
- Status
```

**Domain Events & Impacts:**
[Previous events plus:]
- TravelProviderRegistered
  > Updates available travel options
- RouteAdded
  > Updates travel packages
- AccommodationUpdated
  > Updates package availability

### 4. Booking Module (BookingContext)
```plaintext
TravelPackage (Root)
- PackageId
- CustomerInfo (VO)
- Schedule (VO)
- TravelArrangements (Entity)
  - Transportation (Entity)
    - Type
    - Provider
    - Schedule
    - Class
  - Accommodation (Entity)
    - HotelInfo
    - RoomType
    - CheckIn/Out
- ServiceBookings (collection)
- TotalPrice (VO)
- Status

ServiceBooking (Root)
- BookingId
- CustomerInfo (VO)
- ServiceInfo (VO)
- Schedule (VO)
- Status
- PaymentInfo

TransportBooking (Root)
- BookingId
- CustomerInfo (VO)
- RouteInfo (Entity)
- PassengerDetails (Entity)
- Status

AccommodationBooking (Root)
- BookingId
- CustomerInfo (VO)
- StayPeriod (VO)
- RoomDetails (Entity)
- Status
```

**Domain Events & Impacts:**
[Previous events plus:]
- TravelPackageCreated
  > Initiates multiple bookings
- TransportBooked
  > Updates package status
- AccommodationBooked
  > Updates package status

### 5. Payment Module (PaymentContext)
[Previous content remains the same]

### 6. Recommendation Module (RecommendationContext)
```plaintext
RecommendationRules (Root)
- RuleId
- RuleType
- Conditions (Entity)
  - FactorType
  - Weight
  - Parameters
- Status

RecommendationSnapshot (Root)
- CustomerId
- GeneratedDate
- ExpiryDate
- ServiceRecommendations (Entity)
- TravelRecommendations (Entity)
  - Routes
  - Accommodations
  - Packages
- ProviderRecommendations (Entity)
```

### 7. Common Module (CommonContext)
```plaintext
Location (Root)
- LocationId
- Name
- LocationType
- LinkId
```

**Domain Events & Impacts:**
[Previous events plus:]
- TravelRecommendationsGenerated
  > Updates customer suggestions
- PackageRecommendationsUpdated
  > Updates available packages

This architecture supports comprehensive travel services while maintaining unified history and seamless integration across all service types.

## 🎯 Architecture Overview

LSevin demonstrates a pragmatic approach to modern .NET architecture:

- **Vertical Slice Architecture**: Organizes code by business features rather than technical layers, reducing coupling and improving maintainability
- **Modular Monolith**: Balances the simplicity of monolithic deployment with the maintainability of modular design
- **YARP API Gateway**: Routes and manages API traffic with modern .NET reverse proxy
- **CQRS with MediatR**: Clean separation of read and write operations using the mediator pattern
- **Domain Events**: Loose coupling between modules using the outbox pattern
- **Building Blocks**: Reusable components for caching, security, validation, and more

## 🚀 Key Features

### Architectural Features
- **Feature Organization**: Business capabilities organized in vertical slices
- **Module Independence**: Self-contained modules with explicit boundaries
- **Gateway Routing**: Centralized API management with YARP
- **Mediator Pattern**: Command and query handling with MediatR
- **Outbox Pattern**: Reliable message delivery for domain events
- **Essential Building Blocks**: Core components for cross-cutting concerns

### Technical Features
- **Modern .NET**: Built with .NET 9.0 and minimal APIs
- **PostgreSQL & EF Core**: Robust data persistence
- **Redis Caching**: High-performance distributed caching
- **Message Queuing**: Event handling with RabbitMQ
- **JWT Authentication**: Secure API access
- **API Documentation**: OpenAPI integration

## 🛠️ Technology Stack

### Core Framework
- **.NET 9.0** with native AOT support
- **ASP.NET Core** with minimal APIs
- **Entity Framework Core**
- **YARP API Gateway**
- **MediatR**

### Infrastructure
- **PostgreSQL**: Primary data store
- **Redis**: Distributed caching
- **RabbitMQ**: Message broker
- **Docker**: Containerization

## 📁 Project Structure

### Root Directory Structure
```
.
├── .config
├── .csharpierrc.yaml
├── .editorconfig
├── .gitattributes
├── .gitignore
├── CONTRIBUTION.md
├── LICENSE
├── LSevin.sln.DotSettings.user
├── LSevin.slnx
├── README.md
├── global.json
├── lsevin.slnx
├── nuget.config
├── src
└── stylecop.json
```

### Source Structure
```
src/
├── API/
│   ├── LSevin.Api
│   └── LSevin.ApiGateway.Yarp
├── BuildingBlocks/
│   ├── BuildingBlocks.Caching
│   ├── BuildingBlocks.Core
│   ├── BuildingBlocks.EventBus.Masstransit
│   ├── BuildingBlocks.Messaging.Persistence
│   ├── BuildingBlocks.OpenTelemetry
│   ├── BuildingBlocks.Persistence.EfCore.Postgres
│   ├── BuildingBlocks.Security
│   ├── BuildingBlocks.Validation
│   └── BuildingBlocks.Web
├── Directory.Build.props
├── Directory.Build.targets
├── Directory.Packages.props
├── Modules/
│   └── Identity/
│       └── LSevin.Modules.Identity
└── Packages.props
```

## 🏗️ Module Structure

Each module follows a vertical slice architecture pattern:

```
Module/
├── Account/               # Business Feature Group
│   └── Features/          # Feature Slices
│       └── LoginUser/     # Single Feature Slice
│           ├── LoginUserCommand.cs
│           ├── LoginUserCommandHandler.cs
│           └── LoginUserEndpoint.cs
├── Data/                  # Module Database
│   ├── Migrations/
│   ├── IdentityDbContext.cs
│   ├── IdentityDbContextFactory.cs
│   └── IdentityDbSeeder.cs
├── Constants/             # Module Constants
├── ModuleDefinition.cs    # Module Registration
├── ModuleInformation.cs   # Module Metadata
└── modules.identity.json  # Module Configuration
```

## 🚦 Prerequisites

### Development Environment
- .NET 9.0 SDK
- PostgreSQL 15+
- Redis 7.0+
- Docker Desktop
- Node.js 18+
- Kubernetes (optional, for k8s deployment)
- PM2 (optional, for PM2 deployment)
- Tye (optional, for Tye deployment)

### Tools and Extensions
- C# Dev Kit
- EditorConfig
- SonarLint
- GitFlow
- NUKE Build System
- Project Tye
- PM2

## 🚀 Getting Started

### 1. Clone and Setup
```bash
# Clone repository
git clone https://github.com/raminmansouri/lsevin.git
cd LSevin

# Install development certificates
dotnet dev-certs https --trust

# Install required tools
dotnet tool restore
```

## 🔄 Deployment Options

### 1. Using NUKE Build System
```bash
# Run the build script
./build.sh    # On macOS/Linux
./build.ps1   # On Windows

# Common build targets
./build.sh --target Clean
./build.sh --target Compile
./build.sh --target Test
./build.sh --target Pack
./build.sh --target Push

# Build and push Docker images
./build.sh --target DockerBuild
./build.sh --target DockerPush
```

### 2. GitHub Actions CI/CD
The project includes automated workflows for:
- Continuous Integration (PR validation)
- Continuous Deployment
- Release Management
- Docker Image Publishing

Key workflows:
```bash
.github/workflows/
├── continuous.yml     # Main CI pipeline
├── release.yml       # Release automation
└── docker.yml        # Docker image building and publishing
```

Workflows are automatically triggered on:
- Pull request creation/update
- Push to main branch
- Release creation
- Manual workflow dispatch

### 3. Kubernetes Deployment
```bash
# Create namespace
kubectl create namespace lsevin
kubectl config set-context --current --namespace=lsevin

# Apply configurations
# 1. ConfigMaps
kubectl apply -f deployments/k8s/config-maps/

# 2. Infrastructure Services
kubectl apply -f deployments/k8s/postgresql.yml
kubectl apply -f deployments/k8s/redis.yml
kubectl apply -f deployments/k8s/eventstore.yml
kubectl apply -f deployments/k8s/jaeger.yml

# 3. Application Services
kubectl apply -f deployments/k8s/lsevin-api.yml
kubectl apply -f deployments/k8s/lsevin-api-gateway.yml

# Check deployment status
kubectl get pods
kubectl get services
```

### 4. Project Tye Deployment
```bash
# Install Tye
dotnet tool install -g Microsoft.Tye --version "0.11.0-alpha.22111.1"

# Run the application
cd deployments/tye
tye run

# Run with dashboard
tye run --dashboard

# Deploy to Kubernetes
tye deploy

# Remove deployment
tye undeploy
```

Tye Dashboard will be available at: http://localhost:8000

### 5. PM2 Process Management
```bash
# Install PM2
npm install -g pm2

# Start using YAML configuration
cd deployments/pm2
pm2 start pm2.yaml

# Or start using JSON configuration
pm2 start pm2.json

# Useful PM2 commands
pm2 list                # List all processes
pm2 stop all           # Stop all processes
pm2 restart all        # Restart all processes
pm2 delete all         # Delete all processes
pm2 monit              # Monitor processes
```

## 🔍 Monitoring and Management

### Health Checks
```bash
# Health check endpoints
/health           # Basic health status
/health/ready     # Readiness probe
/health/live      # Liveness probe
/health/detailed  # Detailed status
```

### Observability
- Jaeger UI: http://localhost:16686
- Seq Logs: http://localhost:5341
- Kubernetes Dashboard (if enabled): http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

### API Documentation
- Scalar UI: https://localhost:7000/scalar/v1 (API Gateway)
- OpenAPI JSON: https://localhost:7000/openapi/v1.json

## 🔧 Environment-Specific Deployments

### Development
```bash
# Tye
tye run --watch

# Kubernetes
kubectl apply -f deployments/k8s/ --namespace=lsevin-dev

# PM2
pm2 start deployments/pm2/pm2.yaml --env development
```

### Staging
```bash
# Kubernetes
kubectl apply -f deployments/k8s/ --namespace=lsevin-staging

# PM2
pm2 start deployments/pm2/pm2.yaml --env staging
```

### Production
```bash
# Kubernetes
kubectl apply -f deployments/k8s/ --namespace=lsevin-prod

# PM2
pm2 start deployments/pm2/pm2.yaml --env production
```

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
