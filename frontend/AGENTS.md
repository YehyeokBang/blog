<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Development Guidelines

> These guidelines help create frontend code that is **easy to change** by following four key criteria: Readability, Predictability, Cohesion, and Coupling.

## Core Philosophy

**Easy-to-change code** means:
- New requirements can be implemented by modifying existing code smoothly
- Code intent and behavior are clear and understandable
- The scope of impact from changes is predictable

### Core Principles
1. Readability - Code should be easy to understand
2. Predictability - Consistent patterns and behaviors  
3. Cohesion - Code that changes together stays together
4. Coupling - Minimize dependencies between modules

## 1. Readability

Code that is easy to understand at first glance. Readable code minimizes cognitive context and flows naturally from top to bottom.

### 1.1 Reduce Context

#### Separate Code That Doesn't Execute Together
```javascript
// ❌ Bad: Mixed conditional logic within one giant component
function SubmitButton() {
  const role = useRole();
  return role === "viewer" ? 
    <TextButton disabled>Submit</TextButton> : 
    <Button type="submit">Submit</Button>;
}

// ✅ Good: Separated by clear distinct roles/states
function SubmitButton() {
  const role = useRole();
  return role === "viewer" ? <ViewerSubmitButton /> : <AdminSubmitButton />;
}
```

#### Abstract Implementation Details
```javascript
// ❌ Bad: Low-level details exposed in the component
async function LoginStartPage() {
  const handleLogin = async () => {
    const response = await fetch('/api/login', { /* ... */ });
    // low level data parsing and token management
  };
}

// ✅ Good: Abstracted implementation (UI focuses only on UI)
async function LoginStartPage() {
  const handleLogin = async () => {
    const success = await attemptLogin(username, password);
    if (success) navigateToDashboard();
  };
}
```

#### Split Functions by Logic Type (Only when the component gets too large)
Do not pre-maturely separate hooks. Apply this only when a component exceeds ~100 lines or becomes hard to read.
```javascript
// ✅ Good: Separated by concern (When complexity requires it)
function usePageData() { ... } // Only Data Fetching
function usePageUI() { ... }   // Only UI State (Modals, Toggles)
```

### 1.2 Naming

#### Name Complex Conditions
```javascript
// ❌ Bad: Unclear condition
const isMatched = product.categories.some(c => c.id === id) && price > 10;

// ✅ Good: Named conditions
const isSameCategory = product.categories.some(c => c.id === id);
const isPriceValid = price > 10;
const isMatched = isSameCategory && isPriceValid;
```

### 1.3 Top-to-Bottom Flow

#### Strict Rule: ALL Hooks First, Returns Last
React requires all hooks (`useState`, `useEffect`, `useQuery`) to run in the exact same order every render. **Never place hooks after an early return.**

```javascript
// ❌ FATAL ERROR: Rules of Hooks violation
function UserPolicy() {
  if (!user) return null; // Early return
  
  // 💥 Crash: useEffect might not run on subsequent renders!
  useEffect(() => { trackView(); }, []); 
  return <div>Policy</div>;
}

// ✅ Good: Hooks first, conditional renders later
function UserPolicy() {
  // 1. All Hooks & Data fetching
  useEffect(() => {
    if (user) trackView(); 
  }, [user]);
  
  // 2. All present checks & Early returns
  if (!user) return null;
  
  // 3. Final render
  return <div>Policy</div>;
}
```

## 2. Predictability

### 2.1 Unify Return Types for Similar Functions
```javascript
// ❌ Bad: Inconsistent returns
function useUser() { return useQuery(...); } // Returns query object
function useServerTime() { return useQuery(...).data; } // Returns only data

// ✅ Good: Consistent pattern
function useUser() { return useQuery(...); }
function useServerTime() { return useQuery(...); }
```

### 2.2 Reveal Hidden Logic
```javascript
// ❌ Bad: Hidden side effect
async function fetchBalance() {
  const balance = await api.getBalance();
  logging.log("fetched"); // Hidden side-effect!
  return balance;
}

// ✅ Good: Explicit behavior
const balance = await api.getBalance();
logging.log("fetched"); // Visible at the call site
```

## 3. Cohesion

### 3.1 Colocate Files That Change Together (Feature-Sliced)
```
// ✅ Good: Organized by domain/feature
src/
├── shared/           # Used across features
└── features/
    ├── auth/         # All auth-related code (components, hooks, utils)
    └── products/     # All product-related code
```

### 3.2 Single Source of Truth for Constants
If a magic number or string is used in multiple places for the *same logical reason*, extract it.

## 4. Coupling

### 4.1 Allow Code Duplication (AHA Programming)
*"Duplication is far cheaper than the wrong abstraction."*
```javascript
// ❌ Bad: Forced abstraction creating tight coupling and complex if-else
function useBottomSheet(type) {
  if (type === 'product') { ... }
  else if (type === 'user') { ... }
}

// ✅ Good: Independent implementations (Duplication is fine here!)
function useProductSheet() { /* Product specific */ }
function useUserSheet() { /* User specific */ }
```

### 4.2 Eliminate Props Drilling via Composition
```javascript
// ✅ Good: Composition pattern
function ItemEditModal({ onConfirm }) {
  return (
    <Modal>
      <ItemEditBody>
        <ItemEditList onConfirm={onConfirm} /> {/* Child injected directly */}
      </ItemEditBody>
    </Modal>
  );
}
```

## Implementation Guidelines For AI

When generating frontend code:
1. **Safety First**: Never violate React's Rules of Hooks. Hooks always go at the very top.
2. **Start Simple**: Write the simplest, working solution first. 
3. **AHA (Avoid Hasty Abstractions)**: Extract abstractions only when patterns repeat exactly 3+ times. Do not create complex generic components early on.
4. **Composition over Props**: Use `children` to avoid prop drilling.
5. **No Placeholders**: Build functioning, complete components.

## Refactoring Signals
Consider refactoring when:
- A file exceeds 200 lines
- A function/component exceeds 100 lines
- Props are passed through 3+ components unchanged
- The exact same complex logic appears in 3+ places
