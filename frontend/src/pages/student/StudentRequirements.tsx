import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { studentService } from "../../services";

export default function StudentRequirements() {
  const [uploading, setUploading] = useState(false);
  const [libraryUploaded, setLibraryUploaded] = useState(false);
  const [registrarUploaded, setRegistrarUploaded] = useState(false);
  const [studentIdUploaded, setStudentIdUploaded] = useState(false);
  const [fileLibrary, setFileLibrary] = useState<File | null>(null);
  const [fileRegistrar, setFileRegistrar] = useState<File | null>(null);
  const [fileSDO, setFileSDO] = useState<File | null>(null);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await studentService.getProfile();
        const p = data || {};
        setStudentIdUploaded(!!p.reqValidId);
        setRegistrarUploaded(!!p.reqAdviserForm);
        setLibraryUploaded(!!p.reqOrgForm);
      } catch { }
    })();
  }, []);

  const uploadLibrary = async () => {
    if (!fileLibrary) return;
    setUploading(true);
    try {
      const content = await toBase64(fileLibrary);
      const data = await studentService.updateRequirements({ orgForm: true, file: { name: fileLibrary.name, content }, organizationName: "IMC Coordinator", reqType: "library_card" });
      const p = data.profile || {};
      setLibraryUploaded(!!p.reqOrgForm);
      try { localStorage.setItem("studentProfile", JSON.stringify({ ...(JSON.parse(localStorage.getItem("studentProfile") || "{}")), reqOrgForm: !!p.reqOrgForm })); } catch { }
      setFileLibrary(null);
    } finally {
      setUploading(false);
    }
  };

  const uploadRegistrar = async () => {
    if (!fileRegistrar) return;
    setUploading(true);
    try {
      const content = await toBase64(fileRegistrar);
      const data = await studentService.updateRequirements({ adviserForm: true, file: { name: fileRegistrar.name, content }, organizationName: "Registrar", reqType: "pre_enrollment" });
      const p = data.profile || {};
      setRegistrarUploaded(!!p.reqAdviserForm);
      try { localStorage.setItem("studentProfile", JSON.stringify({ ...(JSON.parse(localStorage.getItem("studentProfile") || "{}")), reqAdviserForm: !!p.reqAdviserForm })); } catch { }
      setFileRegistrar(null);
    } finally {
      setUploading(false);
    }
  };

  const uploadSDO = async () => {
    if (!fileSDO) return;
    setUploading(true);
    try {
      const content = await toBase64(fileSDO);
      const data = await studentService.updateRequirements({ validId: true, file: { name: fileSDO.name, content }, organizationName: "Director, Student Development Office", reqType: "student_id" });
      const p = data.profile || {};
      setStudentIdUploaded(!!p.reqValidId);
      try { localStorage.setItem("studentProfile", JSON.stringify({ ...(JSON.parse(localStorage.getItem("studentProfile") || "{}")), reqValidId: !!p.reqValidId })); } catch { }
      setFileSDO(null);
    } finally {
      setUploading(false);
    }
  };

  const saveChanges = async () => {
    try {
      await studentService.updateRequirements({ validId: studentIdUploaded, adviserForm: registrarUploaded, orgForm: libraryUploaded });
      if (fileLibrary) {
        const content = await toBase64(fileLibrary);
        await studentService.updateRequirements({ orgForm: true, file: { name: fileLibrary.name, content }, organizationName: "IMC Coordinator", reqType: "library_card" });
        setFileLibrary(null);
        setLibraryUploaded(true);
      }
      if (fileRegistrar) {
        const content = await toBase64(fileRegistrar);
        await studentService.updateRequirements({ adviserForm: true, file: { name: fileRegistrar.name, content }, organizationName: "Registrar", reqType: "pre_enrollment" });
        setFileRegistrar(null);
        setRegistrarUploaded(true);
      }
      if (fileSDO) {
        const content = await toBase64(fileSDO);
        await studentService.updateRequirements({ validId: true, file: { name: fileSDO.name, content }, organizationName: "Director, Student Development Office", reqType: "student_id" });
        setFileSDO(null);
        setStudentIdUploaded(true);
      }
      try { localStorage.setItem("studentProfile", JSON.stringify({ ...(JSON.parse(localStorage.getItem("studentProfile") || "{}")), reqValidId: true, reqAdviserForm: true, reqOrgForm: true })); } catch { }
    } catch { }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Requirements Upload</Typography>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Upload the following to continue with your clearance</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }} gap={2}>
            <Paper sx={{ p: 2, border: "1px solid #E5E7EB", minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>IMC / Library</Typography>
              <Typography sx={{ color: libraryUploaded ? "#166534" : "#991B1B" }}>{libraryUploaded ? "Validated library card uploaded" : "Validated library card not uploaded"}</Typography>
              <Box mt={1} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <input type="file" onChange={(e) => setFileLibrary(e.target.files?.[0] || null)} style={{ flex: "1 1 240px", maxWidth: "100%" }} />
                <Button variant="contained" size="small" disabled={uploading || !fileLibrary} onClick={uploadLibrary}>Upload</Button>
              </Box>
            </Paper>
            <Paper sx={{ p: 2, border: "1px solid #E5E7EB", minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Registrar</Typography>
              <Typography sx={{ color: registrarUploaded ? "#166534" : "#991B1B" }}>{registrarUploaded ? "Pre-enrollment screenshot uploaded" : "Pre-enrollment screenshot not uploaded"}</Typography>
              <Box mt={1} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <input type="file" onChange={(e) => setFileRegistrar(e.target.files?.[0] || null)} style={{ flex: "1 1 240px", maxWidth: "100%" }} />
                <Button variant="contained" size="small" disabled={uploading || !fileRegistrar} onClick={uploadRegistrar}>Upload</Button>
              </Box>
            </Paper>
            <Paper sx={{ p: 2, border: "1px solid #E5E7EB", minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Director, Student Development Office</Typography>
              <Typography sx={{ color: studentIdUploaded ? "#166534" : "#991B1B" }}>{studentIdUploaded ? "Validated student ID uploaded" : "Validated student ID not uploaded"}</Typography>
              <Box mt={1} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <input type="file" onChange={(e) => setFileSDO(e.target.files?.[0] || null)} style={{ flex: "1 1 240px", maxWidth: "100%" }} />
                <Button variant="contained" size="small" disabled={uploading || !fileSDO} onClick={uploadSDO}>Upload</Button>
              </Box>
            </Paper>
          </Box>
        </Box>
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button variant="outlined" onClick={saveChanges}>Save changes</Button>
        </Box>
      </Paper>
    </Box>
  );
}
