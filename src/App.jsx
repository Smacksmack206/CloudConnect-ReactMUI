import React, { useState, useEffect, useMemo } from 'react';
import { 
    Container, Box, Typography, TextField, Button, Select, MenuItem, 
    FormControl, InputLabel, Grid, Paper, Modal, IconButton, Tooltip,
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const containerStyle = { padding: '32px', maxWidth: '900px', margin: '0 auto' };
      const paperStyle = { padding: '24px', backgroundColor: '#ffcdd2', color: '#b71c1c', borderRadius: '8px' };
      const preStyle = { marginTop: '16px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px', whiteSpace: 'pre-wrap', overflowX: 'auto', fontFamily: 'monospace' };

      return (
        <div style={containerStyle}>
          <div style={paperStyle}>
            <h1 style={{fontSize: '1.5rem', fontWeight: 600}}>Application Error</h1>
            <p style={{marginTop: '16px'}}>The application has crashed. This is likely a bug in the code.</p>
            <pre style={preStyle}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Material-UI Theme Generator ---
const getTheme = (mode) => createTheme({
    palette: {
        mode,
        ...(mode === 'light' 
            ? {
                primary: { main: '#3f51b5' },
                background: { default: '#f4f5f7', paper: '#ffffff' },
              }
            : { // Dark Mode (Teal)
                primary: { main: '#64ffda' },
                background: { default: '#004752', paper: '#005f6b' },
              }
        ),
    },
});

// --- UI Sub-components ---
const InstructionsModal = ({ open, onClose, content }) => {
    const modalStyle = {
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 700,
        bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
    };
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography variant="h5" component="h2" gutterBottom>Your Personalized Setup Plan</Typography>
                <Box sx={{ maxHeight: '70vh', overflowY: 'auto', pr: 2 }}>{content}</Box>
                <Box sx={{ mt: 3, textAlign: 'right' }}><Button variant="contained" onClick={onClose}>Close</Button></Box>
            </Box>
        </Modal>
    );
};

const CodeBlock = ({ children }) => {
    const textToCopy = Array.isArray(children) ? children.join('') : children;
    const handleCopy = () => navigator.clipboard.writeText(textToCopy);
    return (
        <Box sx={{ position: 'relative', bgcolor: 'action.hover', color: 'text.primary', p: 2, pr: 5, borderRadius: 2, overflowX: 'auto', fontFamily: 'monospace' }}>
            <Tooltip title="Copy to clipboard">
                <IconButton onClick={handleCopy} size="small" sx={{ position: 'absolute', top: 4, right: 4, color: 'text.secondary' }}>
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}><code>{children}</code></pre>
        </Box>
    );
};

const ThemeSwitcher = ({ mode, onChange }) => (
    <ToggleButtonGroup value={mode} exclusive onChange={onChange}>
        <ToggleButton value="light"><Brightness7Icon /></ToggleButton>
        <ToggleButton value="dark"><Brightness4Icon /></ToggleButton>
    </ToggleButtonGroup>
);

// --- Main Application Component ---
export default function App() {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode === 'light' || savedMode === 'dark' ? savedMode : 'light';
    });
    const [configs, setConfigs] = useState({});
    const [selectedConfig, setSelectedConfig] = useState('');
    const [configName, setConfigName] = useState('');
    const [pixelIp, setPixelIp] = useState('');
    const [pixelUser, setPixelUser] = useState('');
    const [sshPort, setSshPort] = useState('22');
    const [sshKeyPaths, setSshKeyPaths] = useState('');
    const [availableKeys, setAvailableKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const theme = useMemo(() => getTheme(mode), [mode]);

    useEffect(() => {
        const savedConfigs = localStorage.getItem('ssh-vnc-configs-mui');
        if (savedConfigs) setConfigs(JSON.parse(savedConfigs));
    }, []);

    useEffect(() => {
        const paths = sshKeyPaths.trim().split('\n').filter(p => p.length > 0);
        setAvailableKeys(paths);
    }, [sshKeyPaths]);

    const handleThemeChange = (event, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
            localStorage.setItem('themeMode', newMode);
        }
    };
    
    const loadConfigsFromStorage = () => {
        const saved = localStorage.getItem('ssh-vnc-configs-mui');
        const parsed = saved ? JSON.parse(saved) : {};
        setConfigs(parsed);
        return parsed;
    };

    const handleLoadConfig = () => {
        if (!selectedConfig) return;
        const data = loadConfigsFromStorage()[selectedConfig];
        if (data) {
            setConfigName(selectedConfig);
            setPixelIp(data.ip || '');
            setPixelUser(data.user || '');
            setSshPort(data.port || '22');
            setSelectedKey(data.keyPath || '');
        }
    };

    const handleSaveConfig = () => {
        if (!configName) return;
        const currentConfigs = loadConfigsFromStorage();
        const newConfigs = { ...currentConfigs, [configName]: { ip: pixelIp, user: pixelUser, port: sshPort, keyPath: selectedKey } };
        localStorage.setItem('ssh-vnc-configs-mui', JSON.stringify(newConfigs));
        setConfigs(newConfigs);
        alert(`Saved '${configName}'`);
    };

    const handleDeleteConfig = () => {
        if (!selectedConfig || !confirm(`Delete '${selectedConfig}'?`)) return;
        const currentConfigs = loadConfigsFromStorage();
        delete currentConfigs[selectedConfig];
        localStorage.setItem('ssh-vnc-configs-mui', JSON.stringify(currentConfigs));
        setConfigs(currentConfigs);
        setConfigName('');
        setSelectedConfig('');
    };
    
    const handleGenerateInstructions = () => {
        if (!pixelIp || !pixelUser || !sshPort || !selectedKey) return;
        const publicKeyPath = `cat ${selectedKey}.pub`;
        const removeHostKeyCommand = `ssh-keygen -R ${pixelIp}`;
        const debianCommands = [
            "# 1. Install & Enable SSH",
            "sudo apt update && sudo apt install -y openssh-server",
            "sudo systemctl enable ssh --now",
            "\n# 2. Add Your Public Key",
            "echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys",
            "\n# 3. Set Permissions",
            "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
        ].join('\n');
        
        setModalContent(
            <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="h6">Step 1: Get Public Key (Mac)</Typography><CodeBlock>{publicKeyPath}</CodeBlock></Grid>
                <Grid item xs={12}><Typography variant="h6">Step 2: Configure Debian Device</Typography><CodeBlock>{debianCommands}</CodeBlock></Grid>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                        <Typography variant="h6" sx={{ color: 'warning.dark' }}>Troubleshooting</Typography>
                        <CodeBlock>{removeHostKeyCommand}</CodeBlock>
                    </Paper>
                </Grid>
            </Grid>
        );
        setIsModalOpen(true);
    };
    
    return (
        <ErrorBoundary>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" component="h1">SSH & VNC Local Manager</Typography>
                        <ThemeSwitcher mode={mode} onChange={handleThemeChange} />
                    </Box>
                    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
                        <InstructionsModal open={isModalOpen} onClose={() => setIsModalOpen(false)} content={modalContent} />
                        <Typography variant="h5" gutterBottom>Configurations</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Load Saved Config</InputLabel>
                                    <Select label="Load Saved Config" value={selectedConfig} onChange={e => setSelectedConfig(e.target.value)}>
                                        <MenuItem value=""><em>-- Select a Configuration --</em></MenuItem>
                                        {Object.keys(configs).sort().map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6} container spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                <Grid item><Button variant="contained" onClick={handleLoadConfig}>Load</Button></Grid>
                                <Grid item><Button variant="outlined" color="primary" onClick={handleSaveConfig}>Save</Button></Grid>
                                <Grid item><Button variant="outlined" color="secondary" onClick={handleDeleteConfig}>Delete</Button></Grid>
                            </Grid>
                        </Grid>
                        
                        <hr style={{margin: '24px 0'}} />

                        <Typography variant="h5" gutterBottom>Connection Details</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}><TextField label="Configuration Name" value={configName} onChange={e => setConfigName(e.target.value)} /></Grid>
                            <Grid item xs={12} sm={6}><TextField label="Pixel (Debian) IP" value={pixelIp} onChange={e => setPixelIp(e.target.value)} /></Grid>
                            <Grid item xs={12} sm={6}><TextField label="Username" value={pixelUser} onChange={e => setPixelUser(e.target.value)} /></Grid>
                            <Grid item xs={12} sm={6}><TextField label="SSH Port" type="number" value={sshPort} onChange={e => setSshPort(e.target.value)} /></Grid>
                        </Grid>

                        <hr style={{margin: '24px 0'}} />

                        <Typography variant="h5" gutterBottom>SSH Key</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Run <code>ls ~/.ssh/id_* | grep -v ".pub$"</code> in Terminal and paste the output below.
                        </Typography>
                        <TextField label="Paste Key Paths Here" multiline rows={3} value={sshKeyPaths} onChange={e => setSshKeyPaths(e.target.value)} sx={{ fontFamily: 'monospace' }} />
                        <FormControl fullWidth sx={{ mt: 3 }}>
                            <InputLabel>Choose an Existing Key</InputLabel>
                            <Select label="Choose an Existing Key" value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
                                <MenuItem value=""><em>-- Select a Key --</em></MenuItem>
                                {availableKeys.map(path => <MenuItem key={path} value={path}>{path.split('/').pop()}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <Box sx={{ pt: 4 }}>
                            <Button variant="contained" size="large" fullWidth onClick={handleGenerateInstructions}>Generate Setup Instructions</Button>
                        </Box>
                    </Paper>
                </Container>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
