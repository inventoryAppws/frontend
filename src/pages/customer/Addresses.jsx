/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Pencil } from "lucide-react";
import { createAddress, deleteAddress, getAddresses, updateAddress } from "../../services/addressService";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorMessage from "../../components/ErrorMessage";
import Modal from "../../components/Modal";
import { getErrorMessage } from "../../utils/errorHandler";

const emptyAddress = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", type: "Home" };

function Addresses({ embedded = false }) {
  const [addresses, setAddresses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form, setForm] = useState(emptyAddress);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAddresses = async () => {
    try { setAddresses(await getAddresses()); }
    catch (loadError) { setError(getErrorMessage(loadError)); }
  };

  useEffect(() => { loadAddresses(); }, []);
  useEffect(() => {
    if (currentIndex > addresses.length - 1 && addresses.length > 0) {
      setCurrentIndex(addresses.length - 1);
    }
  }, [addresses, currentIndex]);

  const openAddModal = () => {
    setForm(emptyAddress);
    setError("");
    setShowAddModal(true);
  };
  const openEditModal = (address) => { setForm({ ...address }); setEditingAddress(address); setShowAddModal(true); };

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const address = editingAddress ? await updateAddress(editingAddress._id, form) : await createAddress(form);
      setAddresses((current) => editingAddress ? current.map((item) => item._id === address._id ? address : item) : [address, ...current]);
      setEditingAddress(null);
      setShowAddModal(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async () => {
    if (!addressToDelete) return;
    setDeleting(true);
    try {
      await deleteAddress(addressToDelete._id);
      setAddresses((current) => {
        const updated = current.filter((address) => address._id !== addressToDelete._id);
        setCurrentIndex((prev) => Math.min(prev, Math.max(updated.length - 1, 0)));
        return updated;
      });
      setAddressToDelete(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  const currentAddress = addresses[currentIndex] || null;

  return (
    <div className={`address-page ${embedded ? "address-page-embedded" : ""}`}>
      {!embedded ? (
        <div className="page-header address-page-header">
          <div>
            <span className="cart-eyebrow">DELIVERY LOCATIONS</span>
            <h1>My Address</h1>
            <p>Save delivery addresses for a faster checkout.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> Add New Address</button>
        </div>
      ) : (
        <div className="section-heading compact-heading address-embedded-header">
          <div>
            <span className="cart-eyebrow">SAVED ADDRESSES</span>
            <h2>Delivery locations</h2>
          </div>
          <button type="button" className="btn btn-primary" onClick={openAddModal}><Plus size={18} /> Add New Address</button>
        </div>
      )}

      <ErrorMessage message={error} onRetry={loadAddresses} />

      {addresses.length === 0 ? (
        <div className="empty-card empty-address-card">
          <div className="empty-state-icon-box">
            <MapPin size={38} />
          </div>
          <h2>No saved addresses</h2>
          <p>Add a delivery address to make checkout fast and seamless.</p>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={17} /> Add New Address
          </button>
        </div>
      ) : embedded ? (
        <div className="address-compact-shell">
          <div className="address-compact-card">
            <div className="address-compact-header">
              <span className="address-type-label">{currentAddress?.type?.toUpperCase() || "HOME"}</span>
              <span className="address-counter">{addresses.length > 0 ? `${currentIndex + 1} of ${addresses.length}` : "0 of 0"}</span>
            </div>

            <div className="address-compact-body">
              <p className="address-compact-name">{currentAddress?.fullName || "Customer"}</p>
              <p className="address-compact-phone">{currentAddress?.phone || "+91 XXXXX XXXXX"}</p>
              <p className="address-compact-line">{currentAddress?.addressLine1 || "Address Line 1"}</p>
              <p className="address-compact-line">{currentAddress?.city || "City"}, {currentAddress?.state || "State"} - {currentAddress?.pincode || "000000"}</p>
            </div>

            <div className="address-compact-footer">
              <div className="address-inline-actions">
                <button type="button" className="address-inline-btn" onClick={() => openEditModal(currentAddress)}>Edit</button>
                <button type="button" className="address-inline-btn danger" onClick={() => setAddressToDelete(currentAddress)}>Delete</button>
              </div>

              <div className="address-carousel-controls">
                <button type="button" className="carousel-nav-btn" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(value - 1, 0))} aria-label="Previous address">&lt;</button>
                <button type="button" className="carousel-nav-btn" disabled={currentIndex === addresses.length - 1} onClick={() => setCurrentIndex((value) => Math.min(value + 1, addresses.length - 1))} aria-label="Next address">&gt;</button>
              </div>
            </div>
          </div>

          <button type="button" className="view-all-addresses-btn" onClick={() => setCurrentIndex(0)}>
            View All Addresses
          </button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((address) => (
            <article className="address-card" key={address._id}>
              <div className="address-card-heading">
                <span className="address-badge">{address.type}</span>
                <div><button type="button" className="icon-btn" aria-label="Edit address" onClick={() => openEditModal(address)}><Pencil size={16} /></button><button type="button" className="icon-btn icon-btn-danger" aria-label="Delete address" onClick={() => setAddressToDelete(address)}><Trash2 size={17} /></button></div>
              </div>
              <h3>{address.fullName}</h3>
              <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
              <p>{address.city}, {address.state} - {address.pincode}</p>
              <strong>{address.phone}</strong>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => !saving && setShowAddModal(false)} title={editingAddress ? "Edit Address" : "Add New Address"}>
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">{editingAddress ? "Update your delivery address details." : "Add a new delivery address for shipping."}</p>
          <form onSubmit={saveAddress}>
            <div className="checkout-form-grid">
              {[["fullName", "Full Name"], ["phone", "Mobile Number"], ["addressLine1", "Address"], ["addressLine2", "Address Line 2 (optional)"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"]].map(([name, label]) => (
                <div className={name.startsWith("addressLine") ? "form-group checkout-full-width" : "form-group"} key={name}>
                  <label htmlFor={name}>{label}</label>
                  <input id={name} name={name} value={form[name]} required={name !== "addressLine2"} maxLength={name === "phone" ? 10 : name === "pincode" ? 6 : undefined} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
                </div>
              ))}
            </div>
            <div className="address-type-options">
              {["Home", "Work", "Other"].map((type) => <button type="button" key={type} className={`address-type-card ${form.type === type ? "selected" : ""}`} onClick={() => setForm({ ...form, type })}>{type}</button>)}
            </div>
            <div className="refined-modal-footer"><button type="button" className="btn-refined-cancel" onClick={() => { setShowAddModal(false); setEditingAddress(null); }} disabled={saving}>Cancel</button><button type="submit" className="btn-refined-submit" disabled={saving}>{saving ? "Saving..." : editingAddress ? "Save Changes" : "Save Address"}</button></div>
          </form>
        </div>
      </Modal>

      <ConfirmModal isOpen={Boolean(addressToDelete)} title="Delete Address?" message={`Remove ${addressToDelete?.type || "this"} address for ${addressToDelete?.fullName || ""}?`} confirmText="Delete Address" onConfirm={removeAddress} onCancel={() => !deleting && setAddressToDelete(null)} loading={deleting} />
    </div>
  );
}

export default Addresses;
