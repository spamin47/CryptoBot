function login(username, password){
  await page.click(".tv-header__device-signin-icon"); // goto signin icon
  await page.waitForTimeout(2000);
  await page.click(".icon-2IihgTnv"); // click on signin button
  await page.waitForTimeout(2000);
  await page.click(".i-clearfix"); //goto signIn by email
  await page.click(".tv-control-material-input__wrap"); //goto username
  await page.keyboard.type(username); //enter text
  await page.keyboard.press('Tab'); //goto password
  await page.keyboard.type(password); //enter text
  await page.keyboard.press('Enter');
  return;
}