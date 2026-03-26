import { useState, useEffect, useCallback, useRef } from "react";
import { Dropdown, message, Spin, Checkbox } from "antd";
import {
  DownOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { skillApi } from "../../../api/modules/skill";
import type { SkillSpec } from "../../../api/types";
import styles from "./index.module.less";

export default function SkillSelector() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<SkillSpec[]>([]);
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const togglingRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const skillsData = await skillApi.listSkills();
      if (Array.isArray(skillsData)) {
        setSkills(skillsData);
        const enabled = new Set(
          skillsData.filter((s) => s.enabled).map((s) => s.name)
        );
        setEnabledSkills(enabled);
      }
    } catch (err) {
      console.error("SkillSelector: failed to load skills", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get enabled skill count for display
  const enabledCount = enabledSkills.size;

  // Get display label for trigger button
  const triggerLabel = (() => {
    if (loading) return t("skillSelector.loading");
    if (enabledCount === 0) return t("skillSelector.selectSkills");
    if (enabledCount === 1) {
      const skill = skills.find((s) => enabledSkills.has(s.name));
      return skill?.name || t("skillSelector.oneSkill");
    }
    return t("skillSelector.multipleSkills", { count: enabledCount });
  })();

  const handleToggleSkill = async (skillName: string, currentState: boolean) => {
    if (togglingRef.current) return;

    togglingRef.current = true;
    setToggling((prev) => new Set(prev).add(skillName));

    try {
      if (currentState) {
        // Disable skill
        await skillApi.disableSkill(skillName);
        setEnabledSkills((prev) => {
          const next = new Set(prev);
          next.delete(skillName);
          return next;
        });
        message.success(t("skillSelector.skillDisabled", { name: skillName }));
      } else {
        // Enable skill
        await skillApi.enableSkill(skillName);
        setEnabledSkills((prev) => new Set(prev).add(skillName));
        message.success(t("skillSelector.skillEnabled", { name: skillName }));
      }

      // Notify ChatPage that skills have changed
      window.dispatchEvent(
        new CustomEvent("skills-changed", {
          detail: { enabledSkills: Array.from(enabledSkills) },
        })
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : t("skillSelector.toggleFailed");
      message.error(errorMsg);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(skillName);
        return next;
      });
      togglingRef.current = false;
    }
  };

  const isSkillToggling = (skillName: string) => toggling.has(skillName);

  const dropdownContent = (
    <div className={styles.panel}>
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin size="small" />
        </div>
      ) : skills.length === 0 ? (
        <div className={styles.emptyTip}>
          {t("skillSelector.noSkills")}
        </div>
      ) : (
        <div className={styles.skillsList}>
          {skills.map((skill) => {
            const isEnabled = enabledSkills.has(skill.name);
            const isToggling = isSkillToggling(skill.name);

            return (
              <div
                key={skill.name}
                className={[
                  styles.skillItem,
                  isEnabled ? styles.skillItemEnabled : "",
                ].join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSkill(skill.name, isEnabled);
                }}
              >
                <Checkbox
                  checked={isEnabled}
                  disabled={isToggling}
                  onChange={() => {}}
                  className={styles.checkbox}
                >
                  <span className={styles.skillName}>{skill.name}</span>
                </Checkbox>
                {skill.description && (
                  <span className={styles.skillDescription}>
                    {skill.description}
                  </span>
                )}
                {isToggling && (
                  <LoadingOutlined className={styles.loadingIcon} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <div
        className={[styles.trigger, open ? styles.triggerActive : ""].join(" ")}
      >
        <Sparkles className={styles.icon} size={16} />
        {togglingRef.current && (
          <LoadingOutlined style={{ fontSize: 11, color: "#615ced" }} />
        )}
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
