# Componenti UI Mobile-Optimized

Libreria di componenti ottimizzati per touch interaction e app mobile.

---

## 📦 Componenti Disponibili

### TouchButton

Button ottimizzato per touch con feedback visivo.

```jsx
import TouchButton from "@/components/ui/TouchButton";

<TouchButton variant="contained" color="primary" fullWidth onClick={handleClick}>
  Conferma
</TouchButton>;
```

**Props**:

- Tutte le props di MUI Button
- Default `size="large"` per garantire touch target

**Features**:

- Min-height: 48px
- Scale animation su press (0.97)
- Touch-action: manipulation
- Border radius: 12px

---

### TouchCard

Card con feedback touch per elementi cliccabili.

```jsx
import TouchCard from "@/components/ui/TouchCard";

<TouchCard onClick={() => navigate("/details")} gradient>
  <CardContent>
    <Typography>Card Content</Typography>
  </CardContent>
</TouchCard>;
```

**Props**:

- `onClick`: Function - handler click
- `gradient`: Boolean - applica gradient background
- Tutte le altre props di MUI Card

**Features**:

- Scale animation su press (0.98)
- Gradient background opzionale
- Border radius: 16px
- Cursor pointer quando clickable

---

### MobileInput

TextField ottimizzato per evitare zoom su iOS.

```jsx
import MobileInput from "@/components/ui/MobileInput";

<MobileInput
  label="Email"
  type="email"
  fullWidth
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>;
```

**Props**:

- Tutte le props di MUI TextField
- Default `fullWidth={true}`

**Features**:

- Font-size: 16px (previene zoom iOS)
- Min-height: 48px
- Border radius: 12px
- Focus state ottimizzato

---

## 🎨 Pattern di Utilizzo

### Quick Action Grid

```jsx
<Grid container spacing={2}>
  <Grid item xs={6}>
    <TouchCard onClick={handleAction1} gradient>
      <CardContent sx={{ textAlign: "center" }}>
        <Avatar>
          <Icon />
        </Avatar>
        <Typography>Action 1</Typography>
      </CardContent>
    </TouchCard>
  </Grid>

  <Grid item xs={6}>
    <TouchCard onClick={handleAction2} gradient>
      <CardContent sx={{ textAlign: "center" }}>
        <Avatar>
          <Icon />
        </Avatar>
        <Typography>Action 2</Typography>
      </CardContent>
    </TouchCard>
  </Grid>
</Grid>
```

### Form Mobile-Friendly

```jsx
<Stack spacing={2}>
  <MobileInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} />

  <MobileInput
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />

  <TouchButton variant="contained" fullWidth onClick={handleSubmit}>
    Invia
  </TouchButton>
</Stack>
```

### List Touch-Friendly

```jsx
<List>
  {items.map((item) => (
    <ListItem key={item.id} disablePadding>
      <ListItemButton
        onClick={() => handleSelect(item)}
        sx={{
          py: 2,
          "&:active": {
            bgcolor: "action.selected",
          },
        }}
      >
        <ListItemIcon>
          <Avatar>
            <item.Icon />
          </Avatar>
        </ListItemIcon>
        <ListItemText primary={item.title} secondary={item.subtitle} />
        <ChevronRightIcon />
      </ListItemButton>
    </ListItem>
  ))}
</List>
```

---

## 🔧 Utilities

### mobileUtils.js

```javascript
import {
  hapticFeedback,
  copyToClipboard,
  formatDIDForMobile,
  lockBodyScroll,
  unlockBodyScroll,
} from "@/utils/mobileUtils";

// Vibrazione feedback
hapticFeedback("light"); // 'light' | 'medium' | 'heavy'

// Copy to clipboard
const success = await copyToClipboard("did:ebsi:...");

// Format DID per mobile
const shortDid = formatDIDForMobile("did:ebsi:z...", 12, 8);

// Lock/unlock scroll per modal
lockBodyScroll();
// ... show modal
unlockBodyScroll();
```

---

## 🪝 Hooks

### useMobileDetection

```javascript
import { useMobileDetection } from "@/hooks/useMobileDetection";

function MyComponent() {
  const { isMobile, isSmallScreen, orientation } = useMobileDetection();

  return (
    <Box>
      {isMobile && <MobileView />}
      {orientation === "landscape" && <LandscapeWarning />}
    </Box>
  );
}
```

### useSafeArea

```javascript
import { useSafeArea } from "@/hooks/useMobileDetection";

function MyComponent() {
  const safeArea = useSafeArea();

  return (
    <Box
      sx={{
        paddingTop: `${safeArea.top}px`,
        paddingBottom: `${safeArea.bottom}px`,
      }}
    >
      Content
    </Box>
  );
}
```

### useOnlineStatus

```javascript
import { useOnlineStatus } from "@/hooks/useMobileDetection";

function MyComponent() {
  const isOnline = useOnlineStatus();

  return <Box>{!isOnline && <Alert severity="warning">Sei offline</Alert>}</Box>;
}
```

---

## 🎯 Best Practices

### Touch Targets

✅ Sempre >= 44x44px  
✅ Usa TouchButton per azioni principali  
✅ IconButton 48x48px minimo

### Feedback

✅ Scale animation su press  
✅ Color transition su hover (desktop)  
✅ Haptic feedback per conferme importanti

### Typography

✅ Font-size >= 16px per input  
✅ Line-height 1.5-1.6 per body text  
✅ Contrast ratio >= 4.5:1

### Spacing

✅ Stack spacing={2} (16px)  
✅ Grid spacing={2}  
✅ Padding generosi nei container

### Safe Areas

✅ Usa CSS env() per safe-area-inset  
✅ Bottom navigation con pb safe-area-inset-bottom  
✅ Fixed elements con safe areas

---

## 📱 Testing

### Checklist Componente

- [ ] Touch target >= 44x44px
- [ ] Feedback visivo su press
- [ ] Accessibile (ARIA, semantic HTML)
- [ ] Responsive (320px - 428px)
- [ ] Funziona con keyboard
- [ ] Screen reader friendly

### Testing Tools

- Chrome DevTools Device Emulation
- React DevTools
- Lighthouse Mobile Audit
- Real device testing (Android/iOS)

---

## 🚀 Future Components

- **SwipeCard** - Card con swipe gestures
- **PullToRefresh** - Custom pull to refresh
- **BottomSheet** - Modal bottom sheet mobile
- **FloatingActionButton** - FAB ottimizzato
- **Stepper** - Multi-step forms mobile
- **ImageOptimizer** - Lazy loading images

---

Documentazione aggiornata: 26 Gennaio 2026
