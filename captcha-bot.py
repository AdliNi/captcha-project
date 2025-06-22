from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
import time

# === CONFIG ===
url = "http://localhost/captcha-extension/DummyPage.html"
extension_path = r"C:/xampp/htdocs/captcha-extension"  # Unpacked extension folder

# === Setup Chrome with Unpacked Extension ===
options = webdriver.ChromeOptions()
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument(f"--load-extension={extension_path}")
options.add_argument("--remote-debugging-port=0")  # Avoid DevToolsActivePort crash

# Optional: open devtools or start maximized for visibility
options.add_argument("--start-maximized")

# === Launch Browser ===
print("🚀 Launching Chrome with extension unpacked...")
driver = webdriver.Chrome(service=Service("chromedriver.exe"), options=options)

# === Navigate to Dummy Page ===
print("🔍 Navigating to:", url)
driver.get(url)
time.sleep(2)  # Wait for page and extension to load

# === Simulate Bot-Like Behavior ===
try:
    actions = ActionChains(driver)

    print("🖱️ Simulating straight-line mouse movement...")
    for _ in range(14):
        actions.move_by_offset(50, 0)
        actions.pause(0.05)
    actions.perform()
    actions.reset_actions()

    print("⌨️ Simulating very fast typing...")
    body = driver.find_element(By.TAG_NAME, "body")
    body.click()
    for char in "botinputtext":
        body.send_keys(char)
        time.sleep(0.01)  # Fast typing

    print("📜 Simulating fast scrolling...")
    for _ in range(15):
        driver.execute_script("window.scrollBy(0, 500);")
        time.sleep(0.05)

except Exception as e:
    print("❌ Bot simulation error:", e)

# === Wait & Monitor ===
print("✅ Bot test completed. Waiting to observe CAPTCHA...")
print("🌐 Current page:", driver.current_url)
time.sleep(60)
driver.quit()
