import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown, Input, Spin, message } from "antd";
import { DownOutlined, CheckOutlined, ClearOutlined } from "@ant-design/icons";
import { ShoppingBag, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { crawlerApi } from "../../../api/modules/crawler";
import type { CrawlerProduct } from "../../../api/types";
import styles from "./index.module.less";

/** Format a CrawlerProduct into a structured text block for the chat input. */
function formatProductContext(product: CrawlerProduct): string {
  const lines: string[] = [];
  lines.push(
    `[Product Context - ASIN: ${product.asin}]`,
    `Title: ${product.title}`,
  );
  if (product.brand) lines.push(`Brand: ${product.brand}`);
  if (product.price) lines.push(`Price: ${product.price}`);
  if (product.rating) {
    const reviews = product.review_count
      ? ` (${product.review_count} reviews)`
      : "";
    lines.push(`Rating: ${product.rating}${reviews}`);
  }
  if (product.about_this_item?.length) {
    lines.push("Bullet Points:");
    product.about_this_item.slice(0, 5).forEach((bp) => {
      lines.push(`- ${bp}`);
    });
  }
  if (product.product_description) {
    const desc =
      product.product_description.length > 2000
        ? product.product_description.slice(0, 2000) + "..."
        : product.product_description;
    lines.push(`Description: ${desc}`);
  }
  return lines.join("\n");
}

/**
 * Set the chat textarea content via DOM manipulation.
 *
 * The @agentscope-ai/chat library does not expose setInputContent on
 * AgentScopeRuntimeWebUI's ref, so we use the native value setter
 * pattern to bypass React's controlled component and dispatch an
 * input event so the onChange handler picks up the change.
 */
function setInputContent(text: string) {
  const textarea = document.querySelector<HTMLTextAreaElement>(
    ".copaw-chat-anywhere-input-wrapper textarea",
  );
  if (!textarea) {
    console.warn("[ProductSelector] textarea not found in DOM");
    return;
  }
  // Reset Ant Design's value tracker so React picks up the native change
  const tracker = (textarea as any)._valueTracker;
  if (tracker) {
    tracker.setValue("");
  }
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  nativeSetter?.call(textarea, text);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

export default function ProductSelector() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<CrawlerProduct[]>([]);
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch products when dropdown opens or search changes
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crawlerApi.listProducts({
        search: debouncedSearch || undefined,
        page_size: 20,
        detail_scraped: true,
      });
      setProducts(res?.products || []);
    } catch (err) {
      console.error("ProductSelector: failed to load products", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open, fetchProducts]);

  // Select product — load context into chat input
  const handleSelect = (product: CrawlerProduct) => {
    setSelectedAsin(product.asin);
    setInputContent(formatProductContext(product));
    setOpen(false);
    setSearch("");
    message.success(
      t("productSelector.selected", { asin: product.asin }),
    );
  };

  // Clear selection — clear chat input
  const handleClear = () => {
    setSelectedAsin(null);
    setInputContent("");
    setOpen(false);
  };

  // Trigger button label
  const triggerLabel = selectedAsin
    ? selectedAsin
    : t("productSelector.title");

  // Dropdown content
  const dropdownContent = (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <ShoppingBag className={styles.headerIcon} size={16} />
        <span className={styles.headerTitle}>
          {t("productSelector.title")}
        </span>
      </div>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <Input
          prefix={<Search size={14} style={{ color: "#999" }} />}
          placeholder={t("productSelector.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
          variant="filled"
          className={styles.searchInput}
        />
      </div>

      {/* Product list */}
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyTip}>
          {t("productSelector.empty")}
        </div>
      ) : (
        <div className={styles.productsList}>
          {products.map((product) => {
            const isSelected = product.asin === selectedAsin;
            return (
              <div
                key={product.asin}
                className={[
                  styles.productItem,
                  isSelected ? styles.productActive : "",
                ].join(" ")}
                onClick={() => handleSelect(product)}
              >
                <div className={styles.productHeader}>
                  <div className={styles.productInfo}>
                    <div className={styles.productAsin}>{product.asin}</div>
                    <div className={styles.productTitle}>{product.title}</div>
                    <div className={styles.productMeta}>
                      {product.price && (
                        <span className={styles.productPrice}>
                          {product.price}
                        </span>
                      )}
                      {product.rating && (
                        <span className={styles.productRating}>
                          ★ {product.rating}
                          {product.review_count &&
                            ` (${product.review_count})`}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckOutlined className={styles.checkIcon} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {selectedAsin && (
        <div className={styles.footer}>
          <div className={styles.footerItem} onClick={handleClear}>
            <ClearOutlined size={14} />
            <span>{t("productSelector.clear")}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSearch("");
        }
      }}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <div
        className={[
          styles.trigger,
          open ? styles.triggerActive : "",
          selectedAsin ? styles.triggerSelected : "",
        ].join(" ")}
      >
        <ShoppingBag className={styles.icon} size={16} />
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <DownOutlined
          className={[
            styles.triggerArrow,
            open ? styles.triggerArrowOpen : "",
          ].join(" ")}
        />
      </div>
    </Dropdown>
  );
}
