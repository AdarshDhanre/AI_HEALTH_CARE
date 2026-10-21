# Aadhaar Card System

A dedicated Aadhaar card screen, linked from the Register Patient identity cards and the app sidebar.

## Active frontend component
- `frontend/src/pages/AadhaarScanner.jsx`
- Route: `/aadhaar-scanner`
- Navigation: Sidebar → Aadhaar Card System, or Register Patient → Aadhaar Card

The screen supports a local image preview and a masked last-four-digit reference. It does not upload the image, save Aadhaar data, or verify identity with UIDAI. Official Aadhaar verification requires an authorized, compliant provider. The `frontend/AadhaarScanner.jsx` file in this folder is a copy of the active component for feature organization; the active app uses the component under the main frontend `src/pages` folder.
