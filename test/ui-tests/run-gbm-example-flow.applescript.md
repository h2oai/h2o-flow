tell application "Google Chrome"
  tell (make new window)
    set URL of active tab to "http://localhost:54321/flow/index.html#"
    -- set URL of active tab to "http://localhost:54321/flow/index.html#"
    set bounds to {1400, 22, 3840, 2200} -- 4k
    -- set bounds to {0, 22, 1920, 1200}
  end tell
  activate
end tell

tell application "Google Chrome" to tell active tab of window 1
  delay 1.5
  execute javascript "document.querySelectorAll('div.flow-help div p a')[0].click()"
  execute javascript "document.querySelectorAll('div.flow-help div p a')[0].click()"
  execute javascript "document.querySelectorAll('button.btn-primary')[0].click()"
  delay 0.5
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()"
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- assist
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- import files
  delay 1.5
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()"
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- setup parse
  delay 1.5
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- parse files
  delay 2.0
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()"
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- assist build model
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- build model
  delay 1.5
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()"
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- getModel
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()"
  delay 1.5
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- predict
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- predict model
  delay 1.5
  execute javascript "document.querySelectorAll('i.fa-step-forward')[0].click()" -- get prediction frame
  -- delay 1
  -- execute javascript "window.scroll(0,200)" -- scroll down
end tell

tell application "System Events"
  -- tell application process "Google Chrome"
  -- click at {2764, 200} -- click to activate pane for scrolling
  -- end tell delay 0.25
  -- tell application "Google Chrome" to tell active tab of window 1 to execute javascript "window.scroll(0,200)" -- scroll down
  -- tell application "System Events" to key code 119 -- send End
  tell application "Google Chrome" to activate
  keystroke "j" using {option down, command down} -- open Chrome devtools
  tell application "Google Chrome" to tell active tab of window 1 to execute javascript "document.querySelectorAll('i.fa-angle-double-right')[0].click()" -- close help pane
end tell