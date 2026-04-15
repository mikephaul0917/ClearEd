import { useEffect, useState } from "react";
import { adminService } from "../../services";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Skeleton from "@mui/material/Skeleton";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const COLORS = {
  black: '#3c4043',
  textSecondary: '#6B7280',
  border: '#E5E7EB'
};

interface Quote {
  _id: string;
  text: string;
  author: string;
  page: "login" | "register" | "both";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminQuotesPage({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    author: "",
    page: "both" as "login" | "register" | "both"
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchQuotes();
    }
  }, [refreshTrigger]);

  const fetchQuotes = async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await adminService.getQuotes();
      setQuotes(data || []);
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim() || !formData.author.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Both quote text and author are required.",
        confirmButtonColor: COLORS.black
      });
      return;
    }

    try {
      if (editingQuote) {
        await adminService.updateQuote(editingQuote._id, formData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Quote updated successfully!",
          confirmButtonColor: COLORS.black
        });
      } else {
        await adminService.createQuote(formData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Quote created successfully!",
          confirmButtonColor: COLORS.black
        });
      }

      fetchQuotes();
      handleCloseDialog();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save quote",
        confirmButtonColor: COLORS.black
      });
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      text: quote.text,
      author: quote.author,
      page: quote.page
    });
    setOpenDialog(true);
  };

  const handleDelete = async (quote: Quote) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This quote will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: COLORS.black,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete"
    });

    if (result.isConfirmed) {
      try {
        await adminService.deleteQuote(quote._id);
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Quote deleted successfully!",
          confirmButtonColor: COLORS.black
        });
        fetchQuotes();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to delete quote",
          confirmButtonColor: COLORS.black
        });
      }
    }
  };

  const handleToggleStatus = async (quote: Quote) => {
    try {
      await adminService.toggleQuoteStatus(quote._id);
      fetchQuotes();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to toggle quote status",
        confirmButtonColor: COLORS.black
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuote(null);
    setFormData({
      text: "",
      author: "",
      page: "both"
    });
  };

  const getPageColor = (page: string) => {
    switch (page) {
      case "login": return "#2563EB";
      case "register": return "#059669";
      case "both": return "#7C3AED";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <Box display="grid" gap={2}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 1,
              backgroundColor: "#FFFFFF",
              p: 3
            }}
          >
            <Skeleton width="80%" height={28} sx={{ mb: 1 }} />
            <Skeleton width="30%" height={20} sx={{ mb: 2 }} />
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={100} height={24} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box>

      <Box display="grid" gap={2}>
        {quotes.map((quote) => (
          <Box
            key={quote._id}
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 1,
              backgroundColor: "#FFFFFF",
              p: 3
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
                  "{quote.text}"
                </Typography>
                <Typography sx={{ color: "#6B7280", mb: 2 }}>
                  — {quote.author}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={quote.page.charAt(0).toUpperCase() + quote.page.slice(1)}
                    size="small"
                    sx={{
                      backgroundColor: `${getPageColor(quote.page)}22`,
                      color: getPageColor(quote.page),
                      fontWeight: 600
                    }}
                  />
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontSize: 14, color: "#6B7280" }}>
                      {quote.isActive ? "Active" : "Inactive"}
                    </Typography>
                    <Switch
                      checked={quote.isActive}
                      onChange={() => handleToggleStatus(quote)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton onClick={() => handleEdit(quote)} sx={{ color: "#6B7280" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
                <IconButton onClick={() => handleDelete(quote)} sx={{ color: "#DC2626" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}

        {quotes.length === 0 && (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 1,
              backgroundColor: "#FFFFFF",
              p: 6,
              textAlign: "center"
            }}
          >
            <Typography sx={{ color: "#6B7280", mb: 2 }}>
              No quotes found
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setOpenDialog(true)}
              sx={{ borderColor: COLORS.black, color: COLORS.black }}
            >
              Create your first quote
            </Button>
          </Box>
        )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingQuote ? "Edit Quote" : "Add New Quote"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={3}>
              <FormControl>
                <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>
                  Quote Text
                </FormLabel>
                <TextField
                  multiline
                  rows={3}
                  placeholder="Enter the quote text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  fullWidth
                  required
                />
              </FormControl>
              <FormControl>
                <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>
                  Author
                </FormLabel>
                <TextField
                  placeholder="Enter the author name"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  fullWidth
                  required
                />
              </FormControl>
              <FormControl>
                <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>
                  Display On
                </FormLabel>
                <TextField
                  select
                  value={formData.page}
                  onChange={(e) => setFormData({ ...formData, page: e.target.value as any })}
                  fullWidth
                >
                  <MenuItem value="login">Login Page Only</MenuItem>
                  <MenuItem value="register">Registration Page Only</MenuItem>
                  <MenuItem value="both">Both Pages</MenuItem>
                </TextField>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: COLORS.black, "&:hover": { backgroundColor: "#2d3033" } }}
            >
              {editingQuote ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
