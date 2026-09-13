import { useEffect, useState } from "react";
import {
  Heart,
  Home,
  Smartphone,
  ShoppingBag,
  Sparkles,
  FolderHeart,
  Plus,
  Check,
  FolderPlus,
  ChevronRight,
  Loader2
} from "lucide-react";
import Modal from "./Modal";
import {
  createWishlistCollection,
  getWishlistCollections,
} from "../services/wishlistService";
import { getErrorMessage } from "../utils/errorHandler";

function getCollectionIcon(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("favorite") || n.includes("favourite")) return <Heart size={18} className="picker-icon heart" />;
  if (n.includes("home") || n.includes("living") || n.includes("decor") || n.includes("furniture")) return <Home size={18} className="picker-icon home" />;
  if (n.includes("tech") || n.includes("gadget") || n.includes("electronic") || n.includes("mobile") || n.includes("game") || n.includes("gaming")) return <Smartphone size={18} className="picker-icon tech" />;
  if (n.includes("fashion") || n.includes("style") || n.includes("cloth") || n.includes("shoe")) return <ShoppingBag size={18} className="picker-icon fashion" />;
  if (n.includes("essential")) return <Sparkles size={18} className="picker-icon essential" />;
  return <FolderHeart size={18} className="picker-icon default" />;
}

function WishlistCollectionPicker({ isOpen, onClose, onSelect }) {
  const [collections, setCollections] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setSelectedId(null);
    getWishlistCollections()
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSelectCollection = (colId) => {
    setSelectedId(colId);
    setTimeout(() => {
      onSelect(colId);
    }, 180);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError("");
    try {
      const collection = await createWishlistCollection(trimmed);
      setCollections((current) => [...current, collection]);
      setName("");
      setSelectedId(collection._id);
      setTimeout(() => {
        onSelect(collection._id);
      }, 180);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save to Wishlist" size="small">
      <div className="wishlist-picker-modal">
        <p className="wishlist-picker-subtitle">
          Choose a collection to organize your saved products:
        </p>

        {error && <div className="wishlist-picker-error">{error}</div>}

        <div className="wishlist-picker-list">
          {loading ? (
            <div className="wishlist-picker-loading">
              <Loader2 size={24} className="spin-animate" />
              <span>Loading your collections...</span>
            </div>
          ) : (
            collections.map((collection) => {
              const isSelected = selectedId === collection._id;
              const count = Number(collection.count || 0);
              return (
                <button
                  type="button"
                  key={collection._id}
                  className={`wishlist-picker-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectCollection(collection._id)}
                >
                  <div className="wishlist-picker-item-left">
                    <div className="wishlist-picker-icon-badge">
                      {getCollectionIcon(collection.name)}
                    </div>
                    <div className="wishlist-picker-item-details">
                      <span className="wishlist-picker-item-name">{collection.name}</span>
                      <span className="wishlist-picker-item-count">
                        {count} {count === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>

                  <div className="wishlist-picker-item-right">
                    {isSelected ? (
                      <span className="wishlist-picker-check-badge">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <ChevronRight size={16} className="wishlist-picker-arrow" />
                    )}
                  </div>
                </button>
              );
            })
          )}

          {!loading && collections.length === 0 && (
            <div className="wishlist-picker-empty">
              <FolderPlus size={32} />
              <p>No collections found. Create your first one below!</p>
            </div>
          )}
        </div>

        <div className="wishlist-picker-divider">
          <span>or create new</span>
        </div>

        <form className="wishlist-picker-create" onSubmit={handleCreate}>
          <div className="wishlist-picker-input-wrap">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Dream Setup, Summer Outfits..."
              maxLength={60}
              className="wishlist-picker-input"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary wishlist-picker-create-btn"
            disabled={creating || !name.trim()}
          >
            {creating ? (
              <>
                <Loader2 size={15} className="spin-animate" /> Creating...
              </>
            ) : (
              <>
                <Plus size={16} /> Create & Save
              </>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default WishlistCollectionPicker;
