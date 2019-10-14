;(load "./boot/skim.ss")


(load "./boot/skim-boot-parser.skim")
(load "./boot/skim-boot-environ.skim")
(load "./boot/skim-boot-emitter.skim")

(import (only (skim boot emitter) compile_basic))



(test-group
  "my basic tests"

  (test 10 (* 2 5))
  (define x 10)
  (test 10 x)
)

(test-group
  "compile basic expressions"

  (define res (compile_basic "(* 1 2)"))
  (display res)
  (test "1 * 2;\n" res)
  (test "10.2 / -3;\n" (compile_basic "(/ 10.2 -3)"))
  (test "111 * (2 - 20);\n" (compile_basic "(* 111 (- 2 20))"))
)

(test-group
  "quote"

  (test 1 (quote 1))
  (test "Symbol(a)" (quote a))
)

(test-group
  "compile quote"
  (test "1;\n" (compile_basic "(quote 1)"))
  (test "\"x\";\n" (compile_basic "(quote \"x\")"))
  (test "\"x\";\n" (compile_basic "(quasiquote \"x\")"))
)


