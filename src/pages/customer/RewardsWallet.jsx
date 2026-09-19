import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Gift,
  Sparkles,
  Trophy,
  ArrowRight,
  Clock,
  CheckCircle2,
  Copy,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Star,
  Check,
  RotateCcw,
  ShoppingBag,
  Info
} from 'lucide-react';
import { getRewardsWallet, redeemRewardsPoints } from '../../services/rewardsService';
import Loader from '../../components/Loader';
import { toast } from '../../components/Toast';
import './RewardsWallet.css';

export default function RewardsWallet() {
  const { profile } = useOutletContext() || {};
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const customerId = profile?._id || profile?.id || (() => {
    try {
      const p = JSON.parse(localStorage.getItem('customer_profile') || '{}');
      return p._id || p.id || null;
    } catch {
      return null;
    }
  })();

  const loadRewards = async () => {
    setLoading(true);
    try {
      const data = await getRewardsWallet(customerId);
      setWallet(data);
    } catch (err) {
      console.error('Failed to load rewards wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [customerId]);

  const handleRedeemCoupon = async (coupon) => {
    if (!wallet || wallet.points < coupon.pointsCost) {
      toast.error(`You need at least ${coupon.pointsCost} points to redeem this voucher.`);
      return;
    }

    setRedeemingId(coupon.id);
    try {
      await redeemRewardsPoints(customerId, coupon.pointsCost, coupon.id);
      toast.success(`🎉 Voucher redeemed successfully! Use code "${coupon.code}" at checkout.`);
      navigator.clipboard.writeText(coupon.code);
      setCopiedCode(coupon.code);
      loadRewards();
    } catch (err) {
      toast.error('Failed to redeem voucher: ' + (err.message || 'Error'));
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return (
      <div className="rewards-loading-wrap">
        <Loader text="Loading your Rewards Wallet & Points..." />
      </div>
    );
  }

  const points = wallet?.points ?? 2450;
  const rupeeValue = wallet?.rupeeValue ?? 245;

  return (
    <div className="rewards-wallet-page">
      {/* PAGE HEADER */}
      <div className="rewards-page-header">
        <div className="rewards-header-title-col">
          <div className="rewards-badge-pill">
            <Gift size={14} />
            <span>Customer Loyalty Club</span>
          </div>
          <h1>Rewards Wallet &amp; Points</h1>
          <p>Earn points on every order, review and subscription, then redeem for instant cart discounts.</p>
        </div>
        <Link to="/customer" className="rewards-back-catalog-link">
          <span>Shop &amp; Earn More</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* HERO POINTS BANNER */}
      <div className="rewards-hero-card">
        <div className="rewards-hero-content">
          <div className="rewards-points-main">
            <div className="rewards-points-number-wrap">
              <span className="rewards-big-number">{points.toLocaleString('en-IN')}</span>
              <span className="rewards-points-label">Points Available</span>
            </div>
            <div className="rewards-rupee-conversion">
              <span>= ₹{rupeeValue.toLocaleString('en-IN')} instant checkout discount</span>
            </div>
          </div>

          <div className="rewards-tier-badge-card">
            <div className="rewards-tier-headline">
              <Trophy size={18} className="rewards-trophy-icon" />
              <span className="rewards-tier-name">{wallet?.tierBadge || '🌟 Gold Member'}</span>
            </div>
            <p className="rewards-tier-sub">1.2x Points Multiplier Active</p>

            <div className="rewards-progress-bar-wrap">
              <div className="rewards-progress-track">
                <div className="rewards-progress-fill" style={{ width: '75%' }}></div>
              </div>
              <span className="rewards-progress-hint">
                {wallet?.pointsToNextTier || 550} points to Platinum (2x multiplier)
              </span>
            </div>
          </div>
        </div>

        <div className="rewards-hero-perks">
          <div className="rewards-hero-perk-item">
            <CheckCircle2 size={16} />
            <span>Use points directly at Checkout to save on any order</span>
          </div>
          <div className="rewards-hero-perk-item">
            <CheckCircle2 size={16} />
            <span>No points expiration while your account is active</span>
          </div>
          <div className="rewards-hero-perk-item">
            <CheckCircle2 size={16} />
            <span>Stackable with vendor promo discount coupons</span>
          </div>
        </div>
      </div>

      {/* HOW TO EARN MORE POINTS */}
      <section className="rewards-section">
        <div className="rewards-section-title-row">
          <div className="rewards-section-title-wrap">
            <Sparkles size={18} className="rewards-sparkle-icon" />
            <h2>Ways to Earn Points</h2>
          </div>
          <span className="rewards-section-sub">Simple actions that increase your wallet balance</span>
        </div>

        <div className="rewards-earn-grid">
          {(wallet?.earnRules || []).map((rule, idx) => (
            <div className="rewards-earn-card" key={idx}>
              <div className="rewards-earn-points-tag">{rule.points}</div>
              <h4 className="rewards-earn-title">{rule.activity}</h4>
              <p className="rewards-earn-desc">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REDEEMABLE REWARDS VOUCHERS */}
      <section className="rewards-section">
        <div className="rewards-section-title-row">
          <div className="rewards-section-title-wrap">
            <Gift size={18} className="rewards-gift-icon" />
            <h2>Redeem Rewards Vouchers</h2>
          </div>
          <span className="rewards-section-sub">Exchange your points for exclusive checkout discount vouchers</span>
        </div>

        <div className="rewards-coupons-grid">
          {(wallet?.availableCoupons || []).map((coupon) => {
            const canAfford = points >= coupon.pointsCost;
            const isCopied = copiedCode === coupon.code;
            return (
              <div className={`rewards-coupon-card ${canAfford ? 'affordable' : 'locked'}`} key={coupon.id}>
                <div className="rewards-coupon-header">
                  <div className="rewards-coupon-cost-pill">
                    <Sparkles size={13} />
                    <span>{coupon.pointsCost} Points</span>
                  </div>
                  <span className="rewards-coupon-min-order">
                    {coupon.minOrder > 0 ? `Min. order ₹${coupon.minOrder}` : 'No min. order'}
                  </span>
                </div>

                <h3 className="rewards-coupon-title">{coupon.title}</h3>
                <p className="rewards-coupon-desc">{coupon.description}</p>

                <div className="rewards-coupon-code-box">
                  <span className="rewards-code-text">{coupon.code}</span>
                  <button
                    type="button"
                    className="rewards-copy-code-btn"
                    onClick={() => handleCopyCode(coupon.code)}
                    title="Copy promo code"
                  >
                    {isCopied ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  type="button"
                  className={`rewards-redeem-btn ${canAfford ? 'active' : 'disabled'}`}
                  onClick={() => handleRedeemCoupon(coupon)}
                  disabled={!canAfford || redeemingId === coupon.id}
                >
                  {redeemingId === coupon.id
                    ? 'Redeeming...'
                    : canAfford
                    ? `Redeem for ${coupon.pointsCost} pts`
                    : `Need ${coupon.pointsCost - points} more pts`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* POINTS ACTIVITY HISTORY */}
      <section className="rewards-section">
        <div className="rewards-section-title-row">
          <div className="rewards-section-title-wrap">
            <Clock size={18} className="rewards-clock-icon" />
            <h2>Points Activity History</h2>
          </div>
          <span className="rewards-section-sub">Recent points earned and redeemed</span>
        </div>

        <div className="rewards-history-table-container">
          <table className="rewards-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Reason</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {(wallet?.history || []).map((h, i) => {
                const isEarned = h.type === 'earned';
                const formattedDate = new Date(h.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                return (
                  <tr key={h._id || i}>
                    <td className="rewards-date-cell">{formattedDate}</td>
                    <td className="rewards-activity-cell">
                      <strong>{h.title}</strong>
                    </td>
                    <td className="rewards-reason-cell">{h.reason}</td>
                    <td className={`rewards-points-cell ${isEarned ? 'earned' : 'redeemed'}`}>
                      {isEarned ? `+${h.points}` : `-${h.points}`} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

