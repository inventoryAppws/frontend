import { useState, useEffect } from 'react';
import { Sparkles, Shirt, ShoppingBag, Eye, Check } from 'lucide-react';
import { getCompleteTheLook } from '../../services/recommendationService';
import { addToCart } from '../../services/cartService';
import { toast } from '../Toast';
import './CompleteTheLookRail.css';

export default function CompleteTheLookRail({ product, onTryOn, onCartUpdated }) {
  const [lookData, setLookData] = useState(null);
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    if (!product?._id) return;
    async function loadLook() {
      try {
        const data = await getCompleteTheLook(product._id);
        if (data && data.outfitPieces && data.outfitPieces.length > 1) {
          setLookData(data);
        }
      } catch (err) {
        console.error('Failed to load complete the look:', err);
      }
    }
    loadLook();
  }, [product?._id]);

  if (!lookData || !lookData.outfitPieces || lookData.outfitPieces.length < 2) {
    return null;
  }

  const handleAddOutfitToCart = async () => {
    setAddingAll(true);
    try {
      for (const piece of lookData.outfitPieces) {
        await addToCart(piece._id, 1);
      }
      toast.success(`Added complete outfit (${lookData.outfitPieces.length} pieces) to your cart!`);
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      toast.error('Failed to add outfit to cart.');
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <section className="ctl-rail-container" aria-label="Complete the Look">
      <div className="ctl-header">
        <div className="ctl-title-wrap">
          <Shirt size={20} className="ctl-icon" />
          <div>
            <h3 className="ctl-title">Complete the Look</h3>
            <p className="ctl-subtitle">Stylist-curated full outfit tailored to this garment</p>
          </div>
        </div>

        <div className="ctl-actions-top">
          {onTryOn && (
            <button
              type="button"
              className="ctl-tryon-btn"
              onClick={onTryOn}
            >
              <Sparkles size={15} />
              <span>Try on 3D Avatar</span>
            </button>
          )}
          <button
            type="button"
            className="ctl-add-outfit-btn"
            onClick={handleAddOutfitToCart}
            disabled={addingAll}
          >
            <ShoppingBag size={15} />
            <span>Add Outfit (₹{(lookData.totalOutfitPrice || 0).toLocaleString('en-IN')})</span>
          </button>
        </div>
      </div>

      <div className="ctl-pieces-row">
        {lookData.outfitPieces.map((piece, idx) => (
          <div key={piece._id || idx} className="ctl-piece-card">
            <div className="ctl-piece-role-badge">
              <span>{piece.role || 'Garment'}</span>
            </div>

            <div className="ctl-piece-img-box">
              <img
                src={piece.image || piece.images?.[0] || '/placeholder.png'}
                alt={piece.name}
                className="ctl-piece-img"
              />
            </div>

            <div className="ctl-piece-info">
              <h5 className="ctl-piece-name" title={piece.name}>
                {piece.name}
              </h5>
              <span className="ctl-piece-price">
                ₹{(piece.sellingPrice || piece.price || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

