# Salesforce Lead Automation Suite

This project contains an end-to-end Playwright + TypeScript automation suite for validating core Salesforce Lightning lead management flows.

## Overview

The solution demonstrates a practical browser automation approach for testing key business workflows in a Salesforce environment, including authentication, lead creation, data validation, lead status updates, and lead conversion.

The implementation is organized around a reusable page object structure and a small test data utility to keep the tests readable, maintainable, and easier to extend.

## Scope of Work

The automation covers the following scenarios:

1. Login validation using persisted browser session data
2. Lead creation and management within the Salesforce Leads module
3. Lead conversion flow with account, contact, and opportunity selection
4. Negative scenarios for validation and duplicate handling

## Negative Scenarios

The following validation scenarios are included to cover expected business-rule failures and data integrity checks:

- Attempt creating a Lead with missing mandatory fields and ensure the proper validation error banners are shown.
- Attempt a duplicate Lead email if the environment supports duplicate/merge detection.

These negative tests help verify the application prevents invalid lead creation and enforces data quality rules before records are saved.

## Project Structure

```text
.
├── pages/
│   ├── BasePage.ts
│   ├── HomePage.ts
│   └── LeadPage.ts
├── tests/
│   ├── Login.spec.ts
│   ├── LeadCreationAndManagement.spec.ts
│   └── LeadConvert.spec.ts
├── utils/
│   └── dataGenerator.ts
├── storage/
│   └── storageState.json
├── playwright.config.ts
├── package.json
├── .gitignore
├── README.md
└── node_modules/
```

## Test Coverage

### 1. Login Validation
File: [tests/Login.spec.ts](tests/Login.spec.ts)

This test confirms that the user session is already authenticated and that the Salesforce home page loads successfully after reusing stored browser state.

Key validations:
- the session contains cookies from the saved Playwright state
- the app loads successfully
- the Home page is rendered and ready for interaction

### 2. Lead Creation and Management
File: [tests/LeadCreationAndManagement.spec.ts](tests/LeadCreationAndManagement.spec.ts)

This scenario validates lead creation and management in the Salesforce UI.

The flow includes:
- opening the home page
- locating the Sales area
- navigating to the Leads tab
- creating a new lead with generated data
- checking that the lead detail page opens
- validating the lead ID and displayed field values
- updating the lead status

### 3. Lead Conversion
File: [tests/LeadConvert.spec.ts](tests/LeadConvert.spec.ts)

This scenario verifies the lead conversion process in Salesforce Lightning.

The flow includes:
- creating a lead
- opening the conversion menu actions
- selecting existing account/contact/opportunity options where applicable
- completing the conversion
- confirming the conversion success message is displayed

## Page Object Model

The project follows a page object approach to keep the test logic clear and reusable.

- [pages/BasePage.ts](pages/BasePage.ts): shared browser/page behaviors
- [pages/HomePage.ts](pages/HomePage.ts): home page navigation and search actions
- [pages/LeadPage.ts](pages/LeadPage.ts): lead-specific actions such as creation, detail checks, and updates

This structure reduces duplication and makes the automation easier to maintain as the UI evolves.

## Test Data Generation

Test data is generated through [utils/dataGenerator.ts](utils/dataGenerator.ts).

The utility provides:
- `generateUser()` for deterministic generated user values
- `generateUserByFaker()` for realistic Faker-generated values

This allows the suite to create unique records consistently while testing real-world scenarios.

## Prerequisites

Before running the suite, ensure the following are installed:

- Node.js
- npm
- Playwright
- Playwright browser binaries

## Setup

Install the project dependencies:

```bash
npm install
```

Install the required browsers:

```bash
npx playwright install
```

## Running the Tests

Run the full suite:

```bash
npx playwright test
```

Run individual files:

```bash
npx playwright test tests/Login.spec.ts
npx playwright test tests/LeadCreationAndManagement.spec.ts
npx playwright test tests/LeadConvert.spec.ts
```

Run the tests with Playwright's UI mode:

```bash
npx playwright test --ui
```

Open the HTML report:

```bash
npx playwright show-report
```

## Notes

- The tests rely on the authenticated state stored in [storage/storageState.json](storage/storageState.json).
- Salesforce Lightning selectors may change over time; minor updates may be required if the UI is modified.
- The automation is designed to reflect real-world end-to-end UI validation patterns used in enterprise QA and production-grade testing workflows.

## Summary

This project delivers a focused, working Salesforce automation suite covering the main lead lifecycle processes: login, lead creation, validation, status updates, conversion, and negative validation scenarios. It showcases a structured and maintainable Playwright implementation suitable for client-facing delivery and broader regression coverage.
