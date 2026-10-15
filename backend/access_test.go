package main

import (
	"fmt"
	"testing"
)

func TestHashCodeNormalizes(t *testing.T) {
	want := hashCode("AOZR-ABCD-EFGH-JKMN-PQRS")
	for _, in := range []string{"aozr-abcd-efgh-jkmn-pqrs", "AOZRABCDEFGHJKMNPQRS", " AOZR ABCD　EFGH-JKMN-PQRS "} {
		if got := hashCode(in); got != want {
			t.Errorf("hashCode(%q) が正規化されていない", in)
		}
	}
	if hashCode("AOZR-ABCD-EFGH-JKMN-PQRT") == want {
		t.Error("別のコードが同じハッシュになっている")
	}
}

func TestFailLimiterPerKey(t *testing.T) {
	l := newFailLimiter()
	for i := 0; i < failPerKey; i++ {
		if !l.allow("attacker") {
			t.Fatalf("%d回目で早すぎるブロック", i)
		}
		l.fail("attacker")
	}
	if l.allow("attacker") {
		t.Error("上限を超えてもブロックされない")
	}
	// 攻撃者が失敗し続けても、他のキー（正規利用者）は巻き込まれない
	if !l.allow("victim") {
		t.Error("無関係なキーまでブロックされた")
	}
}

func TestFailLimiterBoundedMemory(t *testing.T) {
	l := newFailLimiter()
	for i := 0; i < maxFailKeys*2; i++ {
		l.fail(fmt.Sprintf("spoofed-%d", i))
	}
	if n := len(l.byKey); n > maxFailKeys {
		t.Errorf("キー数が上限を超えた: %d", n)
	}
}
