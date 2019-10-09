(() => {
  let a = 1;
  let b = 2;

  let make_counter = () =>
    (({ next }) => {
      return () =>
        (({ v }) => {
          next = next + 1;
          return v;
        })({ v: next });
    })({ next: 0 });
  let count1 = make_counter();
  let count2 = make_counter();
  count1();
  count1();
  count1();
  count2();
  count2();
  1;
  true;
  1, 2, 3, hello;
  a;
  process.stdout.write("" + "Hello!");
  return process.stdout.write("\n");
})();
