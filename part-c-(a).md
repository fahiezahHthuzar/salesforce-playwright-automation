### Part C(a): Dynamic Lightning Component Evidence

**Component:** Salesforce Convert Lead – Existing Account Search

**DOM Evidence:** `evidence/partC-dynamic-dom.png`

**Challenge:**
During Lead conversion, the Account Search combobox is rendered within a Salesforce Aura component. The DOM contains generated attributes such as `data-aura-rendered-by="1775:0"`, which are not reliable identifiers for automated tests.

**Unstable locator:**

```ts
page.locator('[data-aura-rendered-by="1775:0"]');
```

**Stable locator:**

```ts
const accountSearch = page.getByRole('combobox', {
  name: 'Search for matching accounts'
});
```

**Explanation:**
The implemented locator identifies the Account Search input using its visible placeholder instead of Salesforce-generated Aura attributes. This is more stable across component re-rendering and avoids depending on internal DOM identifiers.

**Evidence:** The attached DevTools screenshot shows the Account Search combobox and its dynamically generated attributes.