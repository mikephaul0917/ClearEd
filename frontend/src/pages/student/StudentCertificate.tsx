import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { api } from '../../services';

export default function StudentCertificate() {
  const [src, setSrc] = useState<string>("");
  const [approved, setApproved] = useState<boolean>(false);

  const load = async () => {
    const res = await api.get("/clearance/certificate", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    setSrc(url);
  };

  const download = async () => {
    const res = await api.get("/clearance/certificate", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clearance-certificate.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/clearance/timeline");
        const items = res.data.items || [];
        setApproved(items.length > 0 && items.every((i: any) => i.status === "Approved"));
      } catch {
        setApproved(false);
      }
    })();
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Certificate</Typography>
      <Paper sx={{ p: 3 }}>
        <Box mb={2}>
          {approved ? (
            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={download}>Download</Button>
              <Button variant="outlined" onClick={load}>Preview</Button>
            </Box>
          ) : (
            <Box>
              <Typography>Your clearance is not yet available.</Typography>
              <Button variant="text" href="/student/progress" sx={{ mt: 1 }}>View Clearance Progress →</Button>
            </Box>
          )}
        </Box>
        {approved && src && <iframe title="certificate" src={src} style={{ width: "100%", height: 600, border: 0 }} />}
      </Paper>
    </Box>
  );
}
