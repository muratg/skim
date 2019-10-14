(import (only (../bin/skim) compile_basic))
(define compile_string compile_basic)
(test-group
  "my basic tests"

  (test 10 (* 2 5))
  (define x 10)
  (test 10 x)
)

(test-group
  "compile basic expressions"

  (define res (compile_string "(* 1 2)"))
  (display res)
  (test "1 * 2;\n" res)
  (test "10.2 / -3;\n" (compile_string "(/ 10.2 -3)"))
  (test "111 * (2 - 20);\n" (compile_string "(* 111 (- 2 20))"))
)

(test-group
  "quote"

  (test 1 (quote 1))
  (test "Symbol(a)" (quote a))
)

(test-group
  "compile quote"

  (test "1;\n" (compile_string "(quote 1)"))
  (test "\"x\";\n" (compile_string "(quote \"x\")"))
  (test "\"x\";\n" (compile_string "(quasiquote \"x\")"))
)


