# Navisense Navigator

NAVISENSE — Frontend Prototype Implementation Prompt

You are building the first working frontend prototype of NAVISENSE, a GPS-free indoor localization and navigation platform.

I am providing a document called:

“NAVISENSE — Complete UI/UX Design & Wireframe Master Specification”

Treat the attached document as the primary source of truth for the UI/UX, information architecture, screen inventory, user journeys, design system, responsive behavior, and interactions.

Do not redesign the product from scratch. Implement the structure and intent defined in the document.

1. PRODUCT

NAVISENSE is a multi-organization indoor navigation platform.

It has two separate web experiences:

A. Admin Web Portal

Used by organizations such as colleges, hospitals, offices, campuses, etc. to configure their indoor navigation environment.

B. Visitor Web/PWA

A mobile-first web experience that visitors can open after scanning an organization-specific QR code.

The visitor should NOT need to create an account or log in.

The admin DOES require authentication.

2. IMPORTANT MVP RULE

For this first version:

BUILD:

Complete frontend UI

Navigation between screens

Responsive layouts

Interactive components

Mock data

Indoor map prototype

Search experience

Route visualization

QR-code management UI

Map editor prototype

Room and landmark management

Navigation network UI

Validation UI

Visitor navigation experience

DO NOT BUILD YET:

Real AI localization

Real computer vision localization

Real OCR localization

Real IMU/PDR localization

BLE/Wi-Fi positioning

Actual sensor fusion

Production CAD/blueprint parsing

Production GPS replacement algorithms

Real-time positioning hardware integration

Dynamic route planning unless explicitly required by the provided specification

Production authentication

Production backend

Real organization database

Use realistic mock data and clean abstraction layers so these technologies can be integrated later.

The UI must remain technology-agnostic regarding the actual localization mechanism.

3. TECHNOLOGY / IMPLEMENTATION

Create a modern responsive web application.

Use a clean component-based architecture.

Prefer:

React

TypeScript

Tailwind CSS

reusable UI components

clean routing

responsive layouts

maintainable folder structure

Use a suitable modern frontend setup supported by Lovable.

Do not create unnecessary complexity.

The goal is a polished, working frontend product prototype, not a production backend.

4. DESIGN DIRECTION

NAVISENSE should feel like a serious navigation/productivity platform, not a student template.

Design characteristics:

Professional

Modern

Minimal

Navigation-oriented

Map-first

Clean

Trustworthy

Technical but easy to understand

Strong visual hierarchy

Excellent spacing

Accessible

Responsive

Follow the design system in the attached specification for:

Colors

Typography

Spacing

Border radius

Shadows

Buttons

Inputs

Cards

Navigation

Icons

Map styling

Status indicators

Do NOT replace the provided design system with a generic SaaS template.

Avoid:

excessive gradients

excessive glassmorphism

unnecessary animations

overly decorative UI

generic dashboard layouts

random colors

huge marketing sections

The map should feel like one of the primary products of NAVISENSE.

5. ADMIN WEB PORTAL

Implement the complete admin experience described in the specification.

Create routes/screens for:

Admin Login

Forgot Password

Reset Password

Organization Registration

Organization Setup Wizard

Admin Dashboard

Buildings List

Add Building

Building Details

Floor List

Add/Edit Floor

Floor Details

Map Upload

Map Processing Status

Main Map Editor

Room Details

Landmark Management

Navigation Network

Map Validation

QR Code Management

Generate QR

Deployment / Publish

Organization Settings

Profile Settings

Team Settings

Security Settings

General Settings

Follow the exact structure and intent of the attached specification.

6. ADMIN DASHBOARD

Create a realistic dashboard with mock organization data.

Show things such as:

Organization name

Number of buildings

Number of floors

Number of mapped rooms

Navigation readiness

Validation status

QR deployment status

Recent activity

Setup progress

Include clear primary actions such as:

Add Building

Manage Maps

Validate Maps

Generate QR

Publish

7. MAP EDITOR — IMPORTANT

The Map Editor is one of the most important screens.

Make it feel like a real spatial editing tool.

It should contain:

Indoor floor map

Zoom

Pan

Recenter

Floor selector

Room overlays

Room selection

Landmark markers

Navigation nodes

Navigation edges

QR points

Editing controls

Side information panel

Save changes

Validation

Publish controls

Allow mock interactions such as:

Selecting a room

Selecting a landmark

Adding a mock navigation node

Viewing room information

Changing floor

Toggling map layers

Showing/hiding navigation network

Showing/hiding landmarks

Showing/hiding QR points

The map does not need to come from a real CAD parser yet.

Use a realistic indoor-floorplan mock representation.

The Map Editor should be visually impressive and useful enough to demonstrate the future concept.

8. ROOMS AND LANDMARKS

Allow the admin to manage mock:

Rooms

Room name

Room number

Room type

Floor

Description

Accessibility information

Navigation availability

Landmarks

Examples:

Reception

Stairs

Elevator

Restroom

Cafeteria

Exit

Information desk

Provide add/edit/delete style interactions using mock state.

9. NAVIGATION NETWORK

Create a visual interface for managing the indoor navigation graph.

Represent:

Nodes

Rooms

Corridors

Intersections

Stairs

Elevators

Entrances

Landmarks

QR points

Connections

Represent walkable connections between nodes.

Allow the admin to visually inspect the network.

Use mock data.

Do not implement a production graph backend yet.

10. MAP VALIDATION

Create a validation screen that checks the mock map configuration.

Display realistic checks such as:

Rooms without navigation connections

Unconnected navigation nodes

Missing room names

Missing landmarks

Invalid floor connections

Missing QR points

Navigation graph completeness

Use clear:

Success

Warning

Error

states.

Include an overall readiness indicator.

11. QR CODE MANAGEMENT

Create a complete QR management experience.

The organization should be able to:

View existing QR codes

Create a QR code

Select building

Select floor

Select entry point/location

Give the QR a name

Preview the QR

Download/print mock QR

Regenerate QR

Enable/disable QR

See deployment status

The QR should represent context such as:

Organization → Building → Floor → Entry Point

Use mock QR generation for the prototype.

12. SETUP WIZARD

Implement the onboarding/setup wizard from the specification.

Steps:

Organization

Building

Floor Plans

Map Configuration

Rooms & Landmarks

Validation

QR Deployment

Show:

Current step

Progress

Back

Continue

Save progress

Completion state

Make this feel like a real onboarding workflow.

13. VISITOR WEB/PWA

Create a completely separate visitor experience.

The visitor does NOT log in.

It should be optimized for mobile screens.

Implement:

QR Landing / Context

Navigation Home

Destination Search

Search Results

Place Details

Locate Me

Route Preview

Indoor Navigation

Floor Transition

Camera Navigation — advanced/mock

Destination Reached

Follow the attached specification closely.

14. VISITOR QR FLOW

The primary visitor flow should be:

QR Scan
↓
QR Landing
↓
Organization / Building / Floor Context
↓
Navigation Home
↓
Search Destination
↓
Search Results
↓
Select Destination
↓
Place Details
↓
Locate Me
↓
Route Preview
↓
Indoor Navigation
↓
Floor Transition if required
↓
Destination Reached

Create a realistic demonstration using mock data.

15. DESTINATION SEARCH

Create a fast, mobile-friendly search experience.

Support mock searches for:

Room names

Room numbers

Departments

Facilities

Landmarks

Services

Example destinations:

Room 204

Computer Science Department

Main Auditorium

Reception

Library

Cafeteria

Restroom

Elevator

Include:

Search suggestions

Recent destinations

Categories

Search results

Empty state

No-result state

16. ROUTE PREVIEW

After selecting a destination, show:

Current location

Destination

Estimated walking distance

Estimated walking time

Floor information

Route on indoor map

Start Navigation button

Use a visually clear route line.

The route should look like an indoor navigation route, not a normal Google Maps clone.

17. INDOOR NAVIGATION SCREEN

This is another hero screen.

Create a highly polished mobile navigation interface.

Include:

Indoor floor map

Current position marker

Destination marker

Route line

Recenter button

Floor selector

Navigation instruction

Distance remaining

Progress

Next direction

Destination information

Example:

Continue straight

Turn left at the corridor

Take the elevator to Floor 2

Use mock navigation state.

Make it obvious that this is indoor navigation.

18. FLOOR TRANSITION

Create a dedicated floor transition experience.

Example:

You are on Floor 1

Take the elevator

↓

Floor 2

Continue to Room 204


Support:

Elevator

Stairs

Floor switch

Transition animation/state

This should feel integrated into the navigation flow.

19. LOCATE ME

Create a location state system.

Use mock localization states:

Locating

“Finding your location…”

Located

“Location found”

Low confidence

“Location accuracy is low”

Unable to locate

“Couldn’t determine your location”

Provide appropriate recovery actions.

Do not expose the underlying localization technology.

20. LOCALIZATION ABSTRACTION

Create the frontend so localization can later be connected through a simple abstraction.

For example, conceptually:

Localization Service
        ↓
Current Position
        ↓
Navigation UI


The UI should not care whether the future implementation uses:

QR

Camera

Computer Vision

OCR

IMU

BLE

Wi-Fi

Sensor Fusion

another research method

For now, return mock location data.

21. RESPONSIVE DESIGN

Admin

Desktop-first.

The Map Editor should strongly favor desktop/tablet because spatial editing is difficult on a small phone.

Visitor

Mobile-first.

Optimize for approximately:

360px

375px

390px

414px

428px

Also support tablet and desktop.

Do not simply shrink desktop layouts onto mobile.

22. STATES

Implement realistic states throughout the application.

Loading

Empty

Success

Warning

Error

Confirmation

Offline visitor state

Unsaved admin changes

The interface should communicate system confidence clearly.

23. MOCK DATA

Create realistic mock data for at least one organization.

Example:

Organization:
“North Valley Institute”

Building:
“Engineering Block”

Floors:

Ground Floor

Floor 1

Floor 2

Floor 3

Rooms:

Reception

CS Lab 101

CS Lab 102

AI Lab 201

Seminar Hall

Faculty Room

Library

Cafeteria

Landmarks:

Main Entrance

Reception

Elevator

Staircase

Restroom

Information Desk

Use this data consistently across Admin and Visitor interfaces.

Design the data layer so additional organizations and buildings can be added later.

24. MULTI-ORGANIZATION ARCHITECTURE

Even though the prototype may initially contain mock data for one organization, architect the frontend conceptually around:

Organization
→ Buildings
→ Floors
→ Maps
→ Rooms
→ Landmarks
→ Navigation Network
→ QR Points

Do not hard-code the UI so that NAVISENSE only works for one organization.

25. NAVIGATION

Create clear routing between Admin and Visitor.

The Admin experience should have persistent navigation with:

Dashboard

Buildings

QR Codes

Validation

Settings

Use breadcrumbs for nested screens where appropriate.

The Visitor experience should have a simpler navigation structure focused on:

Search

Current navigation

Destination

Map

26. INTERACTIONS

The prototype should actually work.

Do not make every screen a static image.

Implement:

Buttons

Navigation

Forms

Tabs

Modals

Dropdowns

Search

Floor switching

Map interactions

Room selection

Landmark selection

QR management

Wizard progression

Validation states

Navigation simulation

Use mock/local state where backend functionality is not available.

27. ACCESSIBILITY

Follow the accessibility requirements in the attached specification.

Include:

Good contrast

Keyboard-friendly controls

Visible focus states

Minimum comfortable touch targets

Icon + text instead of color alone

Screen-reader-friendly labels

Larger text support where appropriate

28. IMPORTANT PRODUCT PRINCIPLES

Keep these principles throughout the implementation:

The map is a primary product surface.

Never expose complicated localization technology to visitors.

Communicate location confidence clearly.

Visitor flow should be zero-friction.

Admin complexity should be progressive.

One primary action per screen where practical.

Keep the interface professional and research-project ready.

Do not turn NAVISENSE into a generic SaaS dashboard.

Do not turn NAVISENSE into a Google Maps clone.

Keep future localization technologies replaceable.

29. MVP BOUNDARY

Prioritize these features first:

Admin MVP

Login

Organization setup

Dashboard

Building management

Floor management

Map upload

Map editor

Room configuration

Landmark configuration

Navigation network

Validation

QR management

QR generation

Publish/deployment

Visitor MVP

QR context

Search

Search results

Place details

Locate Me

Route preview

Indoor navigation

Floor transition

Arrival

Advanced features such as AI landmark recognition, OCR, camera/AR navigation, voice guidance, BLE/Wi-Fi configuration, analytics, and advanced accessibility routing should be represented as future/advanced features or mock placeholders rather than fully implemented systems.

30. FINAL EXPECTATION

Build NAVISENSE as a polished, interactive frontend prototype that can be demonstrated to a project guide, review committee, or evaluator.

It should feel like a real product rather than a collection of static screens.

The attached UI/UX specification is the source of truth.

Before making major deviations from the specification, preserve the documented information architecture and user journeys.

Start by implementing the core application shell, routing, design system, mock data, Admin Portal, and Visitor Web/PWA.

Then progressively implement the detailed screens and interactions.

Do not attempt to solve the actual indoor localization research problem inside this first Lovable build.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f60a2343-60f0-413c-8d67-c348b778a0bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
